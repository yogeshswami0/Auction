import express from 'express';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - List owners/teams
router.get('/owners', auth, async (req, res) => {
  try {
    const owners = await User.find({ role: 'Owner' })
      .select('-password')
      .populate({
        path: 'squad',
        populate: { path: 'user', select: 'username' }
      });
    res.json(owners);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error fetching teams.' });
  }
});

// GET /api/users/:id - View profile card (Bypasses role restrictions - open to all authenticated users)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'squad',
        populate: { path: 'user', select: 'username' }
      });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

// PUT /api/users/budget - Set/update total budget for all teams (Admin only)
router.put('/budget', auth, isAdmin, async (req, res) => {
  try {
    const { totalBudget } = req.body;
    if (!totalBudget || isNaN(totalBudget) || Number(totalBudget) <= 0) {
      return res.status(400).json({ message: 'Valid total budget is required.' });
    }

    const targetBudget = Number(totalBudget);

    // Fetch all owners/teams populated with squad to compute spends
    const owners = await User.find({ role: 'Owner' }).populate('squad');

    for (const owner of owners) {
      const spent = owner.squad.reduce((sum, p) => sum + (p.finalSalePrice || 0), 0);
      owner.totalBudget = targetBudget;
      owner.remainingBudget = Math.max(0, targetBudget - spent);
      await owner.save();
    }

    res.json({ message: `Successfully updated total budget for all teams to ₹${(targetBudget / 10000000).toFixed(2)} Cr.` });
  } catch (error) {
    console.error('Error updating team budgets:', error);
    res.status(500).json({ message: 'Server error updating team budgets.' });
  }
});

export default router;
