import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getTeamBranding } from '../services/aiService.js';

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, teamName, teamLogo, vibe, primaryColor } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or Email already exists.' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Initial owner setup
    let finalTeamSlogan = '';
    let imageGeneratorPrompt = '';
    
    if (role === 'Owner') {
      if (!teamName) {
        return res.status(400).json({ message: 'Team Name is required for Owners.' });
      }

      // Generate team motto / branding using AI
      try {
        const brandData = await getTeamBranding({
          teamName,
          primaryColor: primaryColor || '#1e3a8a',
          vibe: vibe || 'Fearless'
        });
        finalTeamSlogan = brandData.teamSlogan;
        imageGeneratorPrompt = brandData.imageGeneratorPrompt;
      } catch (err) {
        console.error('Error generating branding motto:', err);
        finalTeamSlogan = 'Dominance & Glory';
      }
    }

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      teamName: role === 'Owner' ? teamName : '',
      teamLogo: role === 'Owner' ? (teamLogo || '') : '',
      teamSlogan: role === 'Owner' ? finalTeamSlogan : '',
      totalBudget: role === 'Owner' ? 100000000 : undefined,
      remainingBudget: role === 'Owner' ? 100000000 : undefined,
      squad: role === 'Owner' ? [] : undefined,
    });

    const savedUser = await newUser.save();

    // Create token
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role, username: savedUser.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        teamName: savedUser.teamName,
        teamLogo: savedUser.teamLogo,
        teamSlogan: savedUser.teamSlogan,
        imageGeneratorPrompt, // optional to return for UI reference
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    }).populate('squad');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamName: user.teamName,
        teamLogo: user.teamLogo,
        teamSlogan: user.teamSlogan,
        totalBudget: user.totalBudget,
        remainingBudget: user.remainingBudget,
        squad: user.squad,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

export default router;
