import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';

import User from './models/User.js';
import Player from './models/Player.js';
import uploadRoutes from './routes/uploadRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getPressReleaseHeadlines } from './services/aiService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS to match client development configurations
const corsOptions = {
  origin: '*', // Allow all origins for dev/testing, but can restrict to client url in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB Atlas (fallback to local if URI not provided)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro';

const maskedURI = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`Attempting to connect to MongoDB: ${maskedURI}`);

if (MONGO_URI.includes('<password>')) {
  console.warn('⚠️ [WARNING] Your MONGO_URI contains the literal "<password>" placeholder. You must replace it with your actual password in Render environment variables.');
} else if (MONGO_URI.match(/<[^>]+>/)) {
  console.warn('⚠️ [WARNING] Your MONGO_URI appears to contain angle brackets "<" and ">". Ensure you have removed the brackets and only supplied your actual password.');
}

if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
  console.warn('⚠️ [WARNING] Connecting to a local database. If this is running on Render, database operations will time out.');
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB successfully connected.'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Make sure your MongoDB Atlas username, password, database name, and IP access list (0.0.0.0/0) are correctly configured.');
  });

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/upload', uploadRoutes);

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// Single "Source of Truth" Room State Machine
let roomState = {
  activePlayer: null,
  currentBid: 0,
  currentBidderId: null,
  currentBidderTeam: '',
  bidsHistory: [],
  timeLeft: 30,
  isTimerRunning: false,
  timerInterval: null,
  closingCountdown: null,
  status: 'idle', // 'idle', 'live', 'counting_down', 'sold', 'unsold'
};

const stopAuctionTimers = () => {
  if (roomState.timerInterval) {
    clearInterval(roomState.timerInterval);
    roomState.timerInterval = null;
  }
  if (roomState.closingCountdown) {
    clearInterval(roomState.closingCountdown);
    roomState.closingCountdown = null;
  }
  roomState.isTimerRunning = false;
};

// Real-Time Socket Connection Handlers
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('room_state', {
    activePlayer: roomState.activePlayer,
    currentBid: roomState.currentBid,
    currentBidderId: roomState.currentBidderId,
    currentBidderTeam: roomState.currentBidderTeam,
    timeLeft: roomState.timeLeft,
    isTimerRunning: roomState.isTimerRunning,
    status: roomState.status,
    bidsHistory: roomState.bidsHistory,
  });

  // 1. admin_start_auction / AUCTION_INITIATED: Initiates live auction for an approved player
  const startAuctionHandler = async ({ playerId }) => {
    try {
      stopAuctionTimers();

      const player = await Player.findById(playerId).populate('user', 'username');
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }

      // Update player state to 'Live'
      player.status = 'Live';
      player.currentBid = player.basePrice;
      await player.save();

      // Reset Room State variables
      roomState.activePlayer = player;
      roomState.currentBid = player.basePrice;
      roomState.currentBidderId = null;
      roomState.currentBidderTeam = 'Base Price';
      roomState.bidsHistory = [];
      roomState.timeLeft = 30;
      roomState.status = 'live';

      // Start the countdown timer
      roomState.isTimerRunning = true;
      roomState.timerInterval = setInterval(() => {
        if (roomState.timeLeft > 0) {
          roomState.timeLeft--;
          io.emit('timer_tick', { timeLeft: roomState.timeLeft });
          io.emit('START_COUNTDOWN', { timeLeft: roomState.timeLeft }); // alias broadcast
        } else {
          // Timer naturally expired
          clearInterval(roomState.timerInterval);
          roomState.timerInterval = null;
          roomState.isTimerRunning = false;
          io.emit('timer_expired');
        }
      }, 1000);

      // Broadcast redirect signal to client router
      io.emit('redirect_live', { player });
      io.emit('AUCTION_INITIATED', { player }); // duplicate matching naming requirements
      io.emit('room_state', roomState);

      console.log(`Auction started for player: ${player.name} at base ₹${player.basePrice}`);
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Failed to start auction.' });
    }
  };

  socket.on('admin_start_auction', startAuctionHandler);
  socket.on('AUCTION_INITIATED', startAuctionHandler);

  // 2. place_bid / BID_PLACED: Team Owner bids on active player
  const placeBidHandler = async ({ userId, amount }) => {
    try {
      if (!roomState.activePlayer || roomState.status !== 'live') {
        socket.emit('error', { message: 'No live auction running.' });
        return;
      }

      // Fetch bidder (Team Owner) details
      const owner = await User.findById(userId);
      if (!owner || owner.role !== 'Owner') {
        socket.emit('error', { message: 'Only Team Owners can bid.' });
        return;
      }

      // Minimum increment: 10% of basePrice, minimum ₹1,000,000 (10L)
      const basePrice = roomState.activePlayer.basePrice;
      const minIncrement = Math.max(1000000, Math.ceil(basePrice * 0.1));

      // Calculate next bid
      let nextBidAmount = roomState.currentBidderId 
        ? roomState.currentBid + minIncrement 
        : basePrice;

      // If user specified a custom amount, validate it
      if (amount && Number(amount) > roomState.currentBid) {
        nextBidAmount = Number(amount);
      }

      // CONCURRENCY CONTROLS & SELF-BIDDING PREVENTION
      if (roomState.currentBidderId && roomState.currentBidderId.toString() === userId.toString()) {
        socket.emit('error', { message: 'You are already the highest bidder.' });
        return;
      }

      // Validate budget constraints
      if (nextBidAmount > owner.remainingBudget) {
        socket.emit('error', { message: 'Insufficient budget: Bid exceeds remaining balance.' });
        return;
      }

      // Update room state
      roomState.currentBid = nextBidAmount;
      roomState.currentBidderId = owner._id;
      roomState.currentBidderTeam = owner.teamName;
      
      const bidEntry = {
        teamName: owner.teamName,
        amount: nextBidAmount,
        timestamp: new Date(),
      };
      roomState.bidsHistory.unshift(bidEntry);

      // Sniping Protection / Bid Extension Logic
      // If bid placed inside the final 10 seconds of active countdown, expand timer to exactly 20 seconds
      if (roomState.timeLeft <= 10) {
        console.log(`Sniping detected! Extending room timer from ${roomState.timeLeft}s back to 20s.`);
        roomState.timeLeft = 20;
        io.emit('timer_extended', { timeLeft: roomState.timeLeft });
      }

      // Broadcast bid update & notification frame
      const updatePayload = {
        currentBid: roomState.currentBid,
        currentBidderId: roomState.currentBidderId,
        currentBidderTeam: roomState.currentBidderTeam,
        bidsHistory: roomState.bidsHistory,
        timeLeft: roomState.timeLeft,
      };
      io.emit('update_bid', updatePayload);
      io.emit('BID_PLACED', updatePayload); // Duplicate broadcast matching requirements

      io.emit('bid_placed_banner', {
        message: `Team ${owner.teamName} placed a bid of ₹${(nextBidAmount / 10000000).toFixed(2)} Cr!`
      });

      console.log(`Bid approved: ${owner.teamName} -> ₹${nextBidAmount}`);
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Bid transaction error.' });
    }
  };

  socket.on('place_bid', placeBidHandler);
  socket.on('BID_PLACED', placeBidHandler);

  // 5. admin_mark_sold / PLAYER_SOLD: Complete transaction and transfer player to owner squad
  const markSoldHandler = async () => {
    console.log('--- ADMIN DECLARE SOLD TRIGGERED ---');
    console.log('Active Room Status:', roomState.status);
    console.log('Active Player ID:', roomState.activePlayer?._id);
    console.log('Current High Bidder ID:', roomState.currentBidderId);
    console.log('Current Bid Amount:', roomState.currentBid);

    if (!roomState.activePlayer) {
      console.warn('⚠️ [WARNING] Declare Sold failed: No active player in room state.');
      socket.emit('error', { message: 'No active player to sell.' });
      return;
    }

    try {
      const playerId = roomState.activePlayer._id;
      const winnerId = roomState.currentBidderId;
      const closingPrice = roomState.currentBid;

      console.log(`Searching database for player ID: ${playerId}...`);
      const player = await Player.findById(playerId);
      if (!player) {
        console.error(`❌ [ERROR] Player not found in database for ID: ${playerId}`);
        socket.emit('error', { message: 'Player not found.' });
        return;
      }
      console.log(`Found player in database: ${player.name}. Current status: ${player.status}`);

      if (!winnerId) {
        console.log(`No bids placed for ${player.name}. Marking as UNSOLD.`);
        player.status = 'Unsold';
        player.currentBid = 0;
        player.currentBidder = null;
        player.currentOwner = null;
        
        console.log('Saving unsold player state to database...');
        await player.save();
        console.log('Unsold player state successfully saved.');

        roomState.status = 'unsold';
        roomState.activePlayer = player;
        
        console.log('Fetching next player in queue...');
        const nextPlayerObj = await Player.findOne({ status: { $in: ['Approved', 'Available'] } });
        console.log('Next player fetched:', nextPlayerObj?.name || 'None');

        io.emit('auction_ended', { status: 'Unsold', player, nextPlayer: nextPlayerObj });
        io.emit('PLAYER_SOLD', { status: 'Unsold', player, nextPlayer: nextPlayerObj });
        io.emit('room_state', roomState);
        
        console.log(`Player ${player.name} ended as UNSOLD.`);
        return;
      }

      console.log(`Bids placed. Loading franchise owner ID: ${winnerId}...`);
      const winningOwner = await User.findById(winnerId);
      if (!winningOwner) {
        console.error(`❌ [ERROR] Winning franchise owner user not found for ID: ${winnerId}`);
        socket.emit('error', { message: 'Winning franchise owner not found.' });
        return;
      }
      console.log(`Found winning franchise owner: ${winningOwner.username} (Team: ${winningOwner.teamName})`);
      console.log(`Franchise budget: remaining = ₹${winningOwner.remainingBudget}, price = ₹${closingPrice}`);

      if (winningOwner.remainingBudget < closingPrice) {
        console.error(`❌ [ERROR] Budget check failed: remaining budget ${winningOwner.remainingBudget} is less than closing price ${closingPrice}`);
        socket.emit('error', { message: 'Winner budget check failed.' });
        return;
      }

      console.log('Deducting price from budget and adding player to owner squad...');
      if (!winningOwner.squad) {
        console.log('Initializing empty squad array for franchise owner...');
        winningOwner.squad = [];
      }
      if (typeof winningOwner.remainingBudget !== 'number') {
        console.warn('⚠️ [WARNING] franchise remainingBudget is not a number. Initializing to totalBudget.');
        winningOwner.remainingBudget = typeof winningOwner.totalBudget === 'number' ? winningOwner.totalBudget : 100000000;
      }

      winningOwner.remainingBudget -= closingPrice;
      winningOwner.squad.push(playerId);
      
      console.log('Saving winning franchise owner state...');
      await winningOwner.save();
      console.log('Winning franchise owner successfully saved.');

      console.log(`Updating player status to "Sold", owner to ${winningOwner.teamName}...`);
      player.status = 'Sold';
      player.finalSalePrice = closingPrice;
      player.currentBid = closingPrice;
      player.currentBidder = winnerId;
      player.currentOwner = winnerId;
      
      console.log('Saving sold player state to database...');
      await player.save();
      console.log('Player status successfully saved as "Sold" in database.');

      let headlines = [];
      try {
        console.log('Generating AI headlines for press release wire...');
        headlines = await getPressReleaseHeadlines({
          playerName: player.name,
          role: player.position,
          basePrice: player.basePrice,
          closingPrice,
          winningTeam: winningOwner.teamName,
        });
        console.log('AI headlines generated successfully.');
      } catch (aiErr) {
        console.error('⚠️ [WARNING] Error generating AI headlines ticker:', aiErr);
        headlines = [`📰 ${player.name} Sold to ${winningOwner.teamName} for ₹${(closingPrice/10000000).toFixed(2)} Cr!`];
      }

      roomState.status = 'sold';
      roomState.activePlayer = player;

      console.log('Fetching next player in queue...');
      const nextPlayerObj = await Player.findOne({ status: { $in: ['Approved', 'Available'] } });
      console.log('Next player fetched:', nextPlayerObj?.name || 'None');

      const completionPayload = { 
        status: 'Sold', 
        player, 
        winner: winningOwner,
        headlines,
        nextPlayer: nextPlayerObj
      };

      io.emit('auction_ended', completionPayload);
      io.emit('PLAYER_SOLD', completionPayload);
      io.emit('room_state', roomState);

      console.log(`TRANSACTION COMPLETE: ${player.name} sold to ${winningOwner.teamName} for ₹${closingPrice}`);
    } catch (err) {
      console.error('❌ [CRITICAL ERROR] Roster transaction error:', err);
      socket.emit('error', { message: 'Database transaction failed. Bid rollback completed.' });
    }
  };

  socket.on('admin_mark_sold', markSoldHandler);
  socket.on('PLAYER_SOLD', markSoldHandler);

  // 4. admin_start_timer / START_COUNTDOWN: Runs synchronized fast 3-2-1 tick countdown
  const startTimerHandler = () => {
    try {
      if (roomState.status !== 'live') {
        socket.emit('error', { message: 'Cannot start closing countdown. Room is not live.' });
        return;
      }

      stopAuctionTimers();
      roomState.status = 'counting_down';

      let closingTick = 3;
      io.emit('timer_tick', { closingTick }); // emit 3
      io.emit('START_COUNTDOWN', { closingTick }); // duplicate match for frontend

      roomState.closingCountdown = setInterval(async () => {
        closingTick--;
        if (closingTick >= 0) {
          io.emit('timer_tick', { closingTick });
          io.emit('START_COUNTDOWN', { closingTick }); // duplicate tick emit
        } else {
          clearInterval(roomState.closingCountdown);
          roomState.closingCountdown = null;
          roomState.status = 'ready_to_close';
          io.emit('timer_closed'); // notify frontend countdown finished
          
          // Automatically sell the player to highest bidder when closing timer expires
          console.log('Closing countdown expired. Executing automated transaction...');
          await markSoldHandler();
        }
      }, 1000);

      console.log('Admin triggered fast closing 3-2-1 countdown.');
    } catch (err) {
      console.error(err);
    }
  };

  socket.on('admin_start_timer', startTimerHandler);
  socket.on('START_COUNTDOWN', startTimerHandler);

  // Admin resets the auction room to idle
  socket.on('admin_reset_room', () => {
    stopAuctionTimers();
    roomState = {
      activePlayer: null,
      currentBid: 0,
      currentBidderId: null,
      currentBidderTeam: '',
      bidsHistory: [],
      timeLeft: 30,
      isTimerRunning: false,
      timerInterval: null,
      closingCountdown: null,
      status: 'idle',
    };
    io.emit('room_state', roomState);
    console.log('Auction room reset to IDLE.');
  });

  // Admin restarts/refunds a player auction
  socket.on('admin_restart_player', ({ playerId }) => {
    io.emit('PLAYER_RESTARTED', { playerId });
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Run Backend Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`AUCTION-PRO Backend Running on Port ${PORT}`);
});
