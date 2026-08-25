import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CountdownOverlay from '../components/CountdownOverlay';
import { Play, RotateCcw, Megaphone, HelpCircle, ShieldAlert, Cpu, ArrowUpRight, User } from 'lucide-react';
import './LiveAuction.css';

const LiveAuction = () => {
  const { user, token, refreshUser } = useAuth();
  const { socket, roomState } = useSocket();

  // local notification banner
  const [notification, setNotification] = useState('');
  const [tickerNews, setTickerNews] = useState([
    "📰 Live auction room open. Welcome, franchises!",
    "📰 AI Co-pilot standing by for Owner bidding strategies."
  ]);
  
  // Celebration and auto-advance queue states
  const [showCelebration, setShowCelebration] = useState(false);
  const [soldInfo, setSoldInfo] = useState(null);
  const [nextPlayerQueue, setNextPlayerQueue] = useState(null);

  // AI Co-Pilot Advice state
  const [coPilotAdvice, setCoPilotAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);

  const bannerTimeoutRef = useRef(null);

  // Sync / Listen to socket broadcasts for banners & tickers
  useEffect(() => {
    if (socket) {
      // 1. Bid placed notifications banner
      socket.on('bid_placed_banner', (data) => {
        setNotification(data.message);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = setTimeout(() => setNotification(''), 4500);
      });

      // 2. Headlines on sale closure
      socket.on('auction_ended', (data) => {
        if (data.status === 'Sold' && data.headlines && data.headlines.length > 0) {
          setTickerNews(prev => [...data.headlines, ...prev]);
        } else if (data.status === 'Unsold') {
          setTickerNews(prev => [`📰 PASS: Player ${data.player?.name || ''} went UNSOLD without bids.`, ...prev]);
        }
        
        // Refresh budget if owner
        if (user && user.role === 'Owner') {
          setTimeout(() => {
            refreshUser();
          }, 1500);
        }
      });

      // 3. PLAYER_SOLD custom celebration and next-in-queue staging hooks
      socket.on('PLAYER_SOLD', (data) => {
        if (data.status === 'Sold') {
          setSoldInfo({
            playerName: data.player?.name,
            winnerTeam: data.winner?.teamName,
            price: data.player?.finalSalePrice,
          });
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }

        if (user && user.role === 'Admin' && data.nextPlayer) {
          setNextPlayerQueue(data.nextPlayer);
        } else {
          setNextPlayerQueue(null);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('bid_placed_banner');
        socket.off('auction_ended');
        socket.off('PLAYER_SOLD');
      }
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [socket, user?.role]);

  // Fetch Co-Pilot advice dynamically when high bid updates (Owners only)
  useEffect(() => {
    if (user?.role === 'Owner' && roomState.activePlayer && roomState.status === 'live') {
      fetchCoPilotAdvice();
    } else {
      setCoPilotAdvice('');
    }
  }, [roomState.currentBid, roomState.activePlayer?._id, user?.role]);

  const fetchCoPilotAdvice = async () => {
    setAdviceLoading(true);
    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          playerId: roomState.activePlayer._id,
          currentBid: roomState.currentBid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCoPilotAdvice(data.advice);
      } else {
        setCoPilotAdvice('Co-Pilot data feed offline.');
      }
    } catch (err) {
      console.error(err);
      setCoPilotAdvice('AI Network connectivity issues.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const handlePlaceBid = () => {
    if (socket) {
      socket.emit('place_bid', { userId: user.id || user._id });
    }
  };

  // Admin controls
  const handleStartTimer = () => {
    if (socket) socket.emit('admin_start_timer');
  };

  const handleMarkSold = () => {
    if (socket) socket.emit('admin_mark_sold');
  };

  const handleResetRoom = () => {
    if (socket) socket.emit('admin_reset_room');
  };

  const getMinIncrement = () => {
    if (!roomState.activePlayer) return 0;
    return Math.max(1000000, Math.ceil(roomState.activePlayer.basePrice * 0.1));
  };

  const isBidDisabled = () => {
    if (roomState.status !== 'live') return true;
    // Don't bid against self
    if (roomState.currentBidderId === (user.id || user._id)) return true;
    
    const increment = getMinIncrement();
    const nextBid = roomState.currentBidderId ? roomState.currentBid + increment : roomState.activePlayer?.basePrice;
    if (nextBid > user.remainingBudget) return true;

    return false;
  };

  const activePlayer = roomState.activePlayer;

  return (
    <div className="space-y-6 relative">
      
      {/* Ticker news wire at the very top */}
      <div className="bg-black/60 border border-white/5 py-2 px-6 rounded-lg overflow-hidden flex items-center gap-3">
        <span className="text-[10px] font-black uppercase text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded tracking-wider flex items-center gap-1 shrink-0">
          <Megaphone className="w-3 h-3" /> Broadcast Wire
        </span>
        <div className="w-full overflow-hidden relative h-5">
          <div className="flex gap-12 animate-marquee whitespace-nowrap text-sm text-gray-300 font-medium">
            {tickerNews.map((news, i) => (
              <span key={i}>{news}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-in notification banner overlays */}
      {notification && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 bg-indigo-600/90 border border-indigo-400 text-white font-bold text-sm px-6 py-3 rounded-full shadow-glow flex items-center gap-2 duration-300 animate-bounce">
          <ArrowUpRight className="w-5 h-5 animate-pulse" />
          {notification}
        </div>
      )}

      {/* Fast 3-2-1 Tick countdown overlays */}
      <CountdownOverlay tick={roomState.closingTick} />

      {/* Main room view layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Player Profile Frame */}
        <div className="lg:col-span-2 p-8 rounded-2xl glass-card border border-white/10 space-y-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {activePlayer ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-2xl border border-white/10 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center relative shadow-lg">
                  {activePlayer.photo ? (
                    <img src={activePlayer.photo} alt={activePlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-indigo-400/50" />
                  )}
                </div>
                
                <div className="flex-1 w-full flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 rounded text-xs bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                        Draft Assets: Position - {activePlayer.position}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                        activePlayer.status === 'Live'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
                          : activePlayer.status === 'Sold'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : activePlayer.status === 'Unsold'
                              ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        Status: {activePlayer.status}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black font-outfit text-white mt-3">{activePlayer.name}</h2>
                  </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">Base Price</p>
                  <p className="text-xl font-bold font-mono text-emerald-400">₹{(activePlayer.basePrice / 10000000).toFixed(2)} Cr</p>
                </div>
              </div>

              {/* Player Stats Details */}
              <div className="grid grid-cols-4 gap-4 border-y border-white/5 py-6 font-mono text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Matches</p>
                  <p className="text-lg font-bold text-white">{activePlayer.stats?.matches || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Runs</p>
                  <p className="text-lg font-bold text-white">{activePlayer.stats?.runs || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Wickets</p>
                  <p className="text-lg font-bold text-white">{activePlayer.stats?.wickets || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Rating</p>
                  <p className="text-lg font-bold text-indigo-400">{activePlayer.stats?.rating || 0}</p>
                </div>
              </div>

              {/* Scouting Insights (Dynamic) */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">AI scouting metrics:</h4>
                <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 font-sans">
                  {activePlayer.scoutingReport || "Evaluation records are processed on live-draft initialization."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-indigo-500/20 flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-indigo-400/40" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Draft Room Empty</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  The auction room is idle. A league Commissioner must start the auction block on an approved player.
                </p>
              </div>
            </div>
          )}

          {/* Bid Button Frame for Owners */}
          {user.role === 'Owner' && activePlayer && (
            <div className="border-t border-white/5 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-500 font-semibold uppercase">Remaining Balance</p>
                <p className="text-lg font-black text-emerald-400 font-outfit">
                  ₹{(user.remainingBudget / 10000000).toFixed(2)} Cr
                </p>
              </div>

              <button
                onClick={handlePlaceBid}
                disabled={isBidDisabled()}
                className={`w-full sm:w-auto px-10 py-4 rounded-xl text-lg font-black tracking-wide uppercase transition-all shadow-lg ${
                  isBidDisabled()
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 shadow-indigo-600/30'
                }`}
              >
                {roomState.currentBidderId === (user.id || user._id) 
                  ? 'Highest Bidder' 
                  : `Bid ₹${((roomState.currentBidderId ? roomState.currentBid + getMinIncrement() : activePlayer.basePrice) / 10000000).toFixed(2)} Cr`
                }
              </button>
            </div>
          )}
        </div>

        {/* Live Auction Board & Co-Pilot */}
        <div className="space-y-6">
          
          {/* Bid Board State Card */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6 relative overflow-hidden">
            {/* Clock Indicator */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Draft Timer</p>
                <p className={`text-3xl font-black font-mono font-outfit leading-none ${
                  roomState.timeLeft <= 10 && roomState.timeLeft > 0 && roomState.isTimerRunning
                    ? 'text-red-500 animate-pulse'
                    : 'text-white'
                }`}>
                  {roomState.timeLeft}s
                </p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                roomState.status === 'live'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}>
                {roomState.status}
              </span>
            </div>

            {/* Price Card */}
            <div className="text-center bg-black/40 p-6 rounded-xl border border-white/5 relative">
              <p className="text-[10px] uppercase font-bold text-gray-500">Current High Bid</p>
              <p className="text-3xl font-black text-emerald-400 font-outfit mt-1 font-mono">
                ₹{(roomState.currentBid / 10000000).toFixed(2)} Cr
              </p>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                Bidder: <span className="text-indigo-400 font-bold">{roomState.currentBidderTeam || 'No Bids'}</span>
              </p>
            </div>

            {/* Bids Log */}
            <div className="space-y-3">
              <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Bid History Log</p>
              <div className="max-h-36 overflow-y-auto space-y-2 text-xs divide-y divide-white/5">
                {roomState.bidsHistory && roomState.bidsHistory.length > 0 ? (
                  roomState.bidsHistory.map((bid, i) => (
                    <div key={i} className="flex justify-between items-center py-2 font-mono">
                      <span className="font-semibold text-white">{bid.teamName}</span>
                      <span className="font-bold text-emerald-400">₹{(bid.amount/10000000).toFixed(2)} Cr</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 py-4">No bids placed on block.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Smart Bidding Co-Pilot Widget */}
          {user.role === 'Owner' && activePlayer && (
            <div className="p-6 rounded-2xl glass-card border border-purple-500/20 bg-purple-500/5 space-y-4 relative">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-400 tracking-wider">
                <Cpu className="w-4 h-4 text-purple-400" /> Draft Strategist Co-Pilot
              </div>

              <div className="bg-black/30 p-4 rounded-xl text-xs text-gray-300 leading-relaxed font-sans border border-purple-500/10">
                {adviceLoading ? (
                  <p className="text-center text-purple-400 animate-pulse font-medium">Synthesizing bid dynamics...</p>
                ) : coPilotAdvice ? (
                  <p className="font-medium">{coPilotAdvice}</p>
                ) : (
                  <p className="text-gray-500">Awaiting bidding parameters to trigger co-pilot calculations.</p>
                )}
              </div>
            </div>
          )}

          {/* Admin Controls Panel */}
          {user.role === 'Admin' && (
            <div className="p-6 rounded-2xl glass-card border border-red-500/20 bg-red-500/5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-red-400 tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Commissioner Room Panel
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <button
                  onClick={handleStartTimer}
                  disabled={roomState.status !== 'live'}
                  className={`py-2 px-3 rounded-lg text-white font-bold transition-all ${
                    roomState.status === 'live'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Start Closing Countdown
                </button>

                <button
                  onClick={handleMarkSold}
                  disabled={!activePlayer || ['sold', 'unsold', 'idle'].includes(roomState.status)}
                  className={`py-2 px-3 rounded-lg text-white font-bold transition-all ${
                    (!activePlayer || ['sold', 'unsold', 'idle'].includes(roomState.status))
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  Declare Sold
                </button>
              </div>

              <button
                onClick={handleResetRoom}
                className="w-full py-2 bg-black/40 hover:bg-black/60 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Force Reset Board
              </button>

              {nextPlayerQueue && (
                <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-center space-y-2">
                  <p className="text-gray-400">Next in Draft Queue:</p>
                  <p className="font-bold text-white text-sm">{nextPlayerQueue.name} ({nextPlayerQueue.position})</p>
                  <button
                    onClick={() => {
                      socket.emit('AUCTION_INITIATED', { playerId: nextPlayerQueue._id });
                      setNextPlayerQueue(null);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-all text-xs"
                  >
                    Draft {nextPlayerQueue.name}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showCelebration && soldInfo && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/90 backdrop-blur-md animate-fadeIn">
          <div className="text-center space-y-6 max-w-lg p-10 rounded-2xl border border-indigo-500/30 glass-card animate-bounce">
            <span className="text-sm font-black tracking-widest text-indigo-400 uppercase block">Championship Draft</span>
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400 font-outfit uppercase font-bold">SOLD!</h2>
            <div className="w-20 h-0.5 bg-indigo-500/20 mx-auto" />
            <p className="text-xl font-medium text-white leading-relaxed">
              Athlete <span className="text-indigo-400 font-black">{soldInfo.playerName}</span> acquired by <span className="text-emerald-400 font-black">{soldInfo.winnerTeam}</span> for a final closing price of:
            </p>
            <p className="text-4xl font-black text-emerald-400 font-mono">₹{(soldInfo.price / 10000000).toFixed(2)} Cr</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAuction;
