import express from 'express';
import Player from '../models/Player.js';
import User from '../models/User.js';
import Rule from '../models/Rule.js';
import { auth } from '../middleware/auth.js';
import { getBiddingAdvice, getTournamentSimulation, getDraftStrategy, getChatbotReply } from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/copilot - Get Real-Time Bidding Co-Pilot advice
router.post('/copilot', auth, async (req, res) => {
  try {
    const { playerId, currentBid } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: 'Player ID is required.' });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found.' });
    }

    // Retrieve owner's squad composition directly from database
    const owner = await User.findById(req.user.id).populate('squad');
    const squadComposition = {
      Batsman: 0,
      Bowler: 0,
      'All-rounder': 0,
      'Wicket-keeper': 0
    };

    if (owner && owner.squad) {
      owner.squad.forEach(p => {
        if (squadComposition[p.position] !== undefined) {
          squadComposition[p.position]++;
        }
      });
    }

    // Retrieve other owners' budgets dynamically from DB
    const otherOwners = await User.find({ role: 'Owner', _id: { $ne: req.user.id } });
    let maxCompetitorBudget = 10000000; // default baseline fallback
    if (otherOwners && otherOwners.length > 0) {
      maxCompetitorBudget = Math.max(...otherOwners.map(o => o.remainingBudget));
    }

    const advice = await getBiddingAdvice({
      player,
      currentBid: currentBid || 0,
      remainingBudget: owner ? owner.remainingBudget : 0,
      squadComposition,
      competitorMaxBudget: maxCompetitorBudget,
    });

    res.json({ advice });
  } catch (error) {
    console.error('Error getting co-pilot advice:', error);
    res.status(500).json({ message: 'Server error generating co-pilot advice.' });
  }
});

// POST /api/ai/simulate - Mock Tournament Simulation Engine
router.post('/simulate', auth, async (req, res) => {
  try {
    // Fetch all owners/teams with full squads
    const owners = await User.find({ role: 'Owner' }).populate('squad');

    if (!owners || owners.length === 0) {
      return res.status(400).json({ message: 'No team owners found to run simulation.' });
    }

    // Format inputs for AI
    const teamsData = owners.map(o => {
      const squadStats = o.squad.reduce((acc, p) => {
        acc.runs += p.stats?.runs || 0;
        acc.wickets += p.stats?.wickets || 0;
        acc.avgRating += p.stats?.rating || 0;
        return acc;
      }, { runs: 0, wickets: 0, avgRating: 0 });

      const squadLen = o.squad.length || 1;
      squadStats.avgRating = parseFloat((squadStats.avgRating / squadLen).toFixed(2));

      return {
        teamName: o.teamName,
        teamSlogan: o.teamSlogan,
        remainingBudget: o.remainingBudget,
        squadCount: o.squad.length,
        squadList: o.squad.map(p => ({
          name: p.name,
          position: p.position,
          rating: p.stats?.rating || 0,
          runs: p.stats?.runs || 0,
          wickets: p.stats?.wickets || 0,
        })),
        metrics: squadStats
      };
    });

    const simulationMarkdown = await getTournamentSimulation(teamsData);

    res.json({ markdown: simulationMarkdown });
  } catch (error) {
    console.error('Error running tournament simulation:', error);
    res.status(500).json({ message: 'Server error generating tournament simulation.' });
  }
});

// POST /api/ai/strategy - Squad Generator & Strategy Maker by AI
router.post('/strategy', auth, async (req, res) => {
  try {
    const owner = await User.findById(req.user.id).populate('squad');
    if (!owner || owner.role !== 'Owner') {
      return res.status(403).json({ message: 'Only Team Owners can request AI draft strategies.' });
    }

    // Fetch all available players (Approved / Available / Unsold, not Sold yet)
    const availablePlayers = await Player.find({ status: { $ne: 'Sold' } });

    const strategyMarkdown = await getDraftStrategy({
      availablePlayers: availablePlayers.map(p => ({
        name: p.name,
        position: p.position,
        basePrice: p.basePrice,
        rating: p.stats?.rating || 0,
      })),
      remainingBudget: owner.remainingBudget,
      currentRoster: owner.squad.map(p => ({
        name: p.name,
        position: p.position,
      })),
    });

    res.json({ strategy: strategyMarkdown });
  } catch (error) {
    console.error('Error generating AI strategy:', error);
    res.status(500).json({ message: 'Server error generating AI strategy.' });
  }
});

// POST /api/ai/chatbot - Chatbot answering queries based on database rules
router.post('/chatbot', auth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query string is required.' });
    }

    // Fetch rules from database
    const rules = await Rule.find({});

    const reply = await getChatbotReply({ query, rules });
    res.json({ reply });
  } catch (error) {
    console.error('Error in rules chatbot:', error);
    res.status(500).json({ message: 'Server error processing chatbot query.' });
  }
});

export default router;
