import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro';

const testFlow = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Find Virat Kohli
    let player = await Player.findOne({ name: 'Virat Kohli' });
    if (!player) {
      console.log('Virat Kohli not found, seeding database...');
      return;
    }

    console.log(`Initial status of ${player.name}: ${player.status}`);

    // Simulate start auction
    player.status = 'Live';
    player.currentBid = player.basePrice;
    await player.save();
    console.log(`After starting auction, status in DB: ${(await Player.findById(player._id)).status}`);

    // Find an owner
    const owner = await User.findOne({ role: 'Owner' });
    if (!owner) {
      console.log('No owner found in DB.');
      return;
    }

    // Simulate mark sold
    player.status = 'Sold';
    player.finalSalePrice = player.basePrice;
    player.currentBid = player.basePrice;
    player.currentBidder = owner._id;
    player.currentOwner = owner._id;
    await player.save();

    console.log(`After marking sold, status in DB: ${(await Player.findById(player._id)).status}`);

    // Now test unsold
    let player2 = await Player.findOne({ name: 'Jasprit Bumrah' });
    if (!player2) {
      console.log('Jasprit Bumrah not found.');
      return;
    }
    console.log(`Initial status of ${player2.name}: ${player2.status}`);

    // Simulate start auction
    player2.status = 'Live';
    player2.currentBid = player2.basePrice;
    await player2.save();
    console.log(`After starting auction, status in DB: ${(await Player.findById(player2._id)).status}`);

    // Simulate mark unsold
    player2.status = 'Unsold';
    player2.currentBid = 0;
    player2.currentBidder = null;
    player2.currentOwner = null;
    await player2.save();

    console.log(`After marking unsold, status in DB: ${(await Player.findById(player2._id)).status}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

testFlow();
