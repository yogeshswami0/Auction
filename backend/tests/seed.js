import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Match from '../models/Match.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro';

const seedDatabase = async () => {
  console.log('--- SEEDING AUCTION-PRO DATABASE ---');

  try {
    await mongoose.connect(MONGO_URI);
    
    // Clear collections
    await User.deleteMany({});
    await Player.deleteMany({});
    await Match.deleteMany({});
    console.log('✓ Cleared database.');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const ownerPassword = await bcrypt.hash('owner123', salt);
    const playerPassword = await bcrypt.hash('player123', salt);

    // 1. Create Admin
    const admin = new User({
      username: 'commissioner',
      email: 'admin@auctionpro.com',
      password: adminPassword,
      role: 'Admin'
    });
    await admin.save();
    console.log('✓ Seeded Admin User (username: commissioner, password: admin123)');

    // 2. Create Owners / Teams
    const owner1 = new User({
      username: 'mumbai_boss',
      email: 'mumbai@ipl.com',
      password: ownerPassword,
      role: 'Owner',
      teamName: 'Mumbai Mavericks',
      teamSlogan: 'Fearless and Victorious',
      totalBudget: 100000000, // 10 Cr
      remainingBudget: 100000000,
      squad: []
    });
    await owner1.save();

    const owner2 = new User({
      username: 'delhi_boss',
      email: 'delhi@ipl.com',
      password: ownerPassword,
      role: 'Owner',
      teamName: 'Delhi Dynamos',
      teamSlogan: 'Aggressive Play, Absolute Glory',
      totalBudget: 100000000, // 10 Cr
      remainingBudget: 100000000,
      squad: []
    });
    await owner2.save();

    const owner3 = new User({
      username: 'chennai_boss',
      email: 'chennai@ipl.com',
      password: ownerPassword,
      role: 'Owner',
      teamName: 'Chennai Chargers',
      teamSlogan: 'Calculated Dominance',
      totalBudget: 100000000, // 10 Cr
      remainingBudget: 100000000,
      squad: []
    });
    await owner3.save();
    console.log('✓ Seeded 3 Team Owner Franchises (password: owner123)');

    // 3. Create Player Accounts & Link Profiles
    const rawPlayers = [
      { name: 'Virat Kohli', position: 'Batsman', basePrice: 20000000, stats: { matches: 250, runs: 12000, wickets: 4, rating: 92 } },
      { name: 'Jasprit Bumrah', position: 'Bowler', basePrice: 20000000, stats: { matches: 120, runs: 200, wickets: 150, rating: 94 } },
      { name: 'Hardik Pandya', position: 'All-rounder', basePrice: 15000000, stats: { matches: 140, runs: 3000, wickets: 80, rating: 88 } },
      { name: 'Rishabh Pant', position: 'Wicket-keeper', basePrice: 15000000, stats: { matches: 98, runs: 2600, wickets: 0, rating: 87 } },
      { name: 'Rohit Sharma', position: 'Batsman', basePrice: 18000000, stats: { matches: 243, runs: 10500, wickets: 8, rating: 90 } },
      { name: 'Rashid Khan', position: 'Bowler', basePrice: 15000000, stats: { matches: 160, runs: 1100, wickets: 185, rating: 91 } },
    ];

    for (let i = 0; i < rawPlayers.length; i++) {
      const pData = rawPlayers[i];
      // Create user account for player
      const pUser = new User({
        username: `player_${i+1}`,
        email: `player${i+1}@auctionpro.com`,
        password: playerPassword,
        role: 'Player'
      });
      await pUser.save();

      // Create profile details
      const player = new Player({
        user: pUser._id,
        name: pData.name,
        position: pData.position,
        basePrice: pData.basePrice,
        status: 'Approved', // Pre-approve for instant draft listing
        stats: pData.stats
      });
      await player.save();
    }

    console.log(`✓ Seeded ${rawPlayers.length} Approved Player Profiles (password: player123)`);

    // 4. Create one initial Match Slot (Conflict check validation base)
    const match = new Match({
      title: 'Opening Derby',
      description: 'Chinnaswamy Stadium, Bangalore',
      homeTeam: owner1._id,
      awayTeam: owner2._id,
      startTime: new Date('2026-06-25T19:30:00')
    });
    await match.save();
    console.log('✓ Seeded 1 Match Scheduled Event.');

    console.log('✓ Seeding complete.');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedDatabase();
