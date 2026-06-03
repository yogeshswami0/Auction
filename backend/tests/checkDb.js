import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro';

const check = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const players = await Player.find();
    console.log('--- PLAYERS IN DB ---');
    players.forEach(p => {
      console.log(`${p.name} - Status: ${p.status}`);
    });
    console.log('---------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
};

check();
