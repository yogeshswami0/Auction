import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro';

const testMarkSold = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB.');

    // 1. Find or create an owner
    let owner = await User.findOne({ role: 'Owner' });
    if (!owner) {
      console.log('No Owner found, creating one...');
      owner = new User({
        username: 'test_owner',
        email: 'test_owner@auction.com',
        password: 'password123',
        role: 'Owner',
        teamName: 'Test Titans',
        totalBudget: 100000000,
        remainingBudget: 100000000
      });
      await owner.save();
    }
    console.log('✓ Owner:', owner.teamName, 'Budget:', owner.remainingBudget);

    // 2. Find or create an approved player
    let player = await Player.findOne({ name: 'Virat Kohli' });
    if (!player) {
      console.log('Virat Kohli not found, creating...');
      // Find a user for player
      let pUser = await User.findOne({ role: 'Player' });
      if (!pUser) {
        pUser = new User({
          username: 'player_vk',
          email: 'vk@auction.com',
          password: 'password123',
          role: 'Player'
        });
        await pUser.save();
      }
      player = new Player({
        user: pUser._id,
        name: 'Virat Kohli',
        position: 'Batsman',
        basePrice: 20000000,
        status: 'Approved'
      });
      await player.save();
    }
    
    // Set to Live first
    player.status = 'Live';
    await player.save();
    console.log('✓ Player set to Live. Status in DB:', (await Player.findById(player._id)).status);

    // 3. Perform markSoldHandler database operations
    const closingPrice = 30000000; // 3 Cr
    owner.remainingBudget -= closingPrice;
    owner.squad.push(player._id);
    await owner.save();
    console.log('✓ Saved Owner squad & remaining budget.');

    player.status = 'Sold';
    player.finalSalePrice = closingPrice;
    player.currentBid = closingPrice;
    player.currentBidder = owner._id;
    player.currentOwner = owner._id;
    await player.save();
    console.log('✓ Saved Player status to Sold.');

    // 4. Retrieve and verify
    const updatedPlayer = await Player.findById(player._id);
    console.log('✓ Re-fetched Player status in DB:', updatedPlayer.status);
    console.log('✓ Re-fetched Player finalSalePrice:', updatedPlayer.finalSalePrice);
    
    const updatedOwner = await User.findById(owner._id).populate('squad');
    console.log('✓ Re-fetched Owner squad count:', updatedOwner.squad.length);
    console.log('✓ Re-fetched Owner remaining budget:', updatedOwner.remainingBudget);

    // Reset status to Approved for next test run
    player.status = 'Approved';
    player.finalSalePrice = 0;
    player.currentBid = 0;
    player.currentBidder = null;
    player.currentOwner = null;
    await player.save();

    owner.remainingBudget = 100000000;
    owner.squad = [];
    await owner.save();
    console.log('✓ Cleanup complete.');

  } catch (err) {
    console.error('❌ Mongoose operation failed:', err);
  } finally {
    await mongoose.connection.close();
  }
};

testMarkSold();
