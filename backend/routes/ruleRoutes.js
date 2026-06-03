import express from 'express';
import Rule from '../models/Rule.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rules - Retrieve all rules (Open to all authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: 1 });
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ message: 'Server error fetching league rules.' });
  }
});

// POST /api/rules - Create a new rule (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const newRule = new Rule({ title, content });
    const saved = await newRule.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ message: 'Server error creating league rule.' });
  }
});

// DELETE /api/rules/:id - Remove a rule (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const deleted = await Rule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Rule not found.' });
    }
    res.json({ message: 'Rule deleted successfully.', id: req.params.id });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ message: 'Server error deleting league rule.' });
  }
});

export default router;
