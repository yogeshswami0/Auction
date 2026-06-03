import express from 'express';
import Player from '../models/Player.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { getMarketPricePrediction } from '../services/aiService.js';

const router = express.Router();

// GET /api/players - Retrieve all players (Supports tab filtering on position/status)
router.get('/', auth, async (req, res) => {
  try {
    const { position, status } = req.query;
    const query = {};

    if (position && position !== 'All') {
      query.position = position;
    }
    
    if (status) {
      query.status = status;
    }

    const players = await Player.find(query).populate('user', 'username email');
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Server error fetching player profiles.' });
  }
});

// GET /api/players/:id - View profile card (Bypasses role restrictions - open to all authenticated users)
router.get('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate('user', 'username email');
    if (!player) {
      return res.status(404).json({ message: 'Player profile not found.' });
    }

    // Auto-generate AI Price Prediction if missing
    if (!player.predictedValue || !player.biddingVibe || !player.scoutingReport) {
      try {
        const totalTeams = await User.countDocuments({ role: 'Owner' }) || 4;
        const prediction = await getMarketPricePrediction({
          player,
          totalTeams,
          startingBudget: 100000000,
        });

        player.predictedValue = prediction.estimatedRange;
        player.biddingVibe = prediction.biddingVibe;
        player.scoutingReport = prediction.marketJustification;
        await player.save();
      } catch (err) {
        console.error('Error generating market predictor for player:', err);
      }
    }

    res.json(player);
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({ message: 'Server error fetching player details.' });
  }
});

// POST /api/players - Create a new player profile (usually self-registration by Player role or Admin creation)
router.post('/', auth, async (req, res) => {
  try {
    const { name, position, basePrice, photo, stats } = req.body;

    if (!name || !position || !basePrice) {
      return res.status(400).json({ message: 'Name, position, and base price are required.' });
    }

    // A User can only have one Player profile
    const existingPlayer = await Player.findOne({ user: req.user.id });
    if (existingPlayer && req.user.role !== 'Admin') {
      return res.status(400).json({ message: 'A player profile already exists for your account.' });
    }

    const newPlayer = new Player({
      user: req.user.role === 'Admin' ? (req.body.userId || req.user.id) : req.user.id,
      name,
      position,
      basePrice,
      photo: photo || '',
      status: req.user.role === 'Admin' ? 'Approved' : 'Pending',
      stats: {
        matches: stats?.matches || 0,
        runs: stats?.runs || 0,
        wickets: stats?.wickets || 0,
        rating: stats?.rating || 0,
      }
    });

    const saved = await newPlayer.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating player profile:', error);
    res.status(500).json({ message: 'Server error creating player profile.' });
  }
});

// PUT /api/players/:id/approve - Approve a pending player (Admin only)
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    player.status = 'Approved';
    await player.save();

    res.json({ message: 'Player approved successfully.', player });
  } catch (error) {
    console.error('Error approving player:', error);
    res.status(500).json({ message: 'Server error approving player.' });
  }
});

// PUT /api/players/:id/restart - Reset/restart auction status of a player (Admin only)
router.put('/:id/restart', auth, isAdmin, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // If player was Sold, we must refund the owner and remove player from their squad
    if (player.status === 'Sold' && player.currentOwner) {
      const owner = await User.findById(player.currentOwner);
      if (owner) {
        owner.remainingBudget += player.finalSalePrice;
        owner.squad = owner.squad.filter(pId => pId.toString() !== player._id.toString());
        await owner.save();
      }
    }

    player.status = 'Available';
    player.finalSalePrice = 0;
    player.currentBid = 0;
    player.currentBidder = null;
    player.currentOwner = null;
    await player.save();

    res.json({ message: 'Player auction restarted successfully.', player });
  } catch (error) {
    console.error('Error restarting player auction:', error);
    res.status(500).json({ message: 'Server error restarting player auction.' });
  }
});

export default router;
