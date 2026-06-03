import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState({
    activePlayer: null,
    currentBid: 0,
    currentBidderId: null,
    currentBidderTeam: '',
    timeLeft: 30,
    isTimerRunning: false,
    status: 'idle',
    bidsHistory: [],
    closingTick: undefined,
  });
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      // Connect to the Socket.io server
      const socketUrl = window.location.port === '3000'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin;
        
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });

      setSocket(newSocket);

      // Listener for raw state payload synchronizations
      newSocket.on('room_state', (state) => {
        setRoomState(state);
      });

      newSocket.on('redirect_live', (data) => {
        setRoomState((prev) => ({
          ...prev,
          activePlayer: data.player,
          status: 'live',
          currentBid: data.player.basePrice,
          currentBidderId: null,
          currentBidderTeam: 'Base Price',
          bidsHistory: [],
          timeLeft: 30,
        }));
        navigate('/live-auction');
      });

      newSocket.on('AUCTION_INITIATED', (data) => {
        setRoomState((prev) => ({
          ...prev,
          activePlayer: data.player,
          status: 'live',
          currentBid: data.player.basePrice,
          currentBidderId: null,
          currentBidderTeam: 'Base Price',
          bidsHistory: [],
          timeLeft: 30,
        }));
        navigate('/live-auction');
      });

      newSocket.on('update_bid', (data) => {
        setRoomState((prev) => ({
          ...prev,
          currentBid: data.currentBid,
          currentBidderId: data.currentBidderId,
          currentBidderTeam: data.currentBidderTeam,
          bidsHistory: data.bidsHistory,
          timeLeft: data.timeLeft,
        }));
      });

      newSocket.on('BID_PLACED', (data) => {
        setRoomState((prev) => ({
          ...prev,
          currentBid: data.currentBid,
          currentBidderId: data.currentBidderId,
          currentBidderTeam: data.currentBidderTeam,
          bidsHistory: data.bidsHistory,
          timeLeft: data.timeLeft,
        }));
      });

      newSocket.on('timer_tick', (data) => {
        setRoomState((prev) => ({
          ...prev,
          timeLeft: data.timeLeft !== undefined ? data.timeLeft : prev.timeLeft,
          closingTick: data.closingTick !== undefined ? data.closingTick : undefined,
          status: data.closingTick !== undefined ? 'counting_down' : prev.status,
        }));
      });

      newSocket.on('START_COUNTDOWN', (data) => {
        setRoomState((prev) => ({
          ...prev,
          timeLeft: data.timeLeft !== undefined ? data.timeLeft : prev.timeLeft,
          closingTick: data.closingTick !== undefined ? data.closingTick : undefined,
          status: data.closingTick !== undefined ? 'counting_down' : prev.status,
        }));
      });

      newSocket.on('timer_extended', (data) => {
        setRoomState((prev) => ({
          ...prev,
          timeLeft: data.timeLeft,
        }));
      });

      newSocket.on('timer_expired', () => {
        setRoomState((prev) => ({
          ...prev,
          isTimerRunning: false,
        }));
      });

      newSocket.on('timer_closed', () => {
        setRoomState((prev) => ({
          ...prev,
          status: 'ready_to_close',
          closingTick: 0,
        }));
      });

      newSocket.on('auction_ended', (data) => {
        setRoomState((prev) => ({
          ...prev,
          status: data.status.toLowerCase(),
          activePlayer: {
            ...prev.activePlayer,
            status: data.status,
            finalSalePrice: data.player?.finalSalePrice,
          },
          closingTick: undefined,
        }));
      });

      newSocket.on('PLAYER_SOLD', (data) => {
        setRoomState((prev) => ({
          ...prev,
          status: data.status.toLowerCase(),
          activePlayer: {
            ...prev.activePlayer,
            status: data.status,
            finalSalePrice: data.player?.finalSalePrice,
          },
          closingTick: undefined,
        }));
      });

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, roomState, setRoomState }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
