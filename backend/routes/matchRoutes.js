import express from 'express';
import Match from '../models/Match.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/matches - Retrieve all matches (Read-only for all authenticated roles)
router.get('/', auth, async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('homeTeam', 'username teamName teamLogo')
      .populate('awayTeam', 'username teamName teamLogo')
      .sort({ startTime: 1 });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error fetching match scheduling.' });
  }
});

// POST /api/matches - Create a match slot (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, homeTeam, awayTeam, startTime } = req.body;

    if (!title || !homeTeam || !awayTeam || !startTime) {
      return res.status(400).json({ message: 'Title, home team, away team, and start time are required.' });
    }

    const targetDate = new Date(startTime);

    // ATOMIC conflict prevention check
    // We check if any match exists at the EXACT target time.
    const existingMatch = await Match.findOne({ startTime: targetDate });

    if (existingMatch) {
      return res.status(400).json({
        message: 'Conflict Detected: This time slot is already occupied by another match event cluster.'
      });
    }

    const newMatch = new Match({
      title,
      description,
      homeTeam,
      awayTeam,
      startTime: targetDate,
    });

    const savedMatch = await newMatch.save();
    
    // Fetch populated match info to return
    const populated = await Match.findById(savedMatch._id)
      .populate('homeTeam', 'username teamName teamLogo')
      .populate('awayTeam', 'username teamName teamLogo');

    res.status(201).json(populated);

  } catch (error) {
    console.error('Error creating match slot:', error);
    // Extra safety if unique index triggers first
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Conflict Detected: This time slot is already occupied by another match event cluster.'
      });
    }
    res.status(500).json({ message: 'Server error scheduling match slot.' });
  }
});

// PUT /api/matches/:id - Modify a match slot (Admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { title, description, homeTeam, awayTeam, startTime } = req.body;
    const matchId = req.params.id;

    if (!title || !homeTeam || !awayTeam || !startTime) {
      return res.status(400).json({ message: 'Title, home team, away team, and start time are required.' });
    }

    const targetDate = new Date(startTime);

    // Conflict prevention check: make sure no other match is scheduled at this time
    const existingMatch = await Match.findOne({ 
      startTime: targetDate, 
      _id: { $ne: matchId } 
    });

    if (existingMatch) {
      return res.status(400).json({
        message: 'Conflict Detected: This time slot is already occupied by another match event cluster.'
      });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      { title, description, homeTeam, awayTeam, startTime: targetDate },
      { new: true }
    )
    .populate('homeTeam', 'username teamName teamLogo')
    .populate('awayTeam', 'username teamName teamLogo');

    if (!updatedMatch) {
      return res.status(404).json({ message: 'Match slot not found.' });
    }

    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match slot:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Conflict Detected: This time slot is already occupied by another match event cluster.'
      });
    }
    res.status(500).json({ message: 'Server error updating match slot.' });
  }
});

// DELETE /api/matches/:id - Delete a match slot (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const deletedMatch = await Match.findByIdAndDelete(req.params.id);
    if (!deletedMatch) {
      return res.status(404).json({ message: 'Match slot not found.' });
    }
    res.json({ message: 'Match slot deleted successfully.', id: req.params.id });
  } catch (error) {
    console.error('Error deleting match slot:', error);
    res.status(500).json({ message: 'Server error deleting match slot.' });
  }
});

export default router;
