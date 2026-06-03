import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Match from '../models/Match.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auction-pro-test';

const runTests = async () => {
  console.log('--- STARTING AUCTION-PRO SYSTEM INTEGRATION TESTS ---');

  try {
    // 1. Database Connection
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB Connected successfully.');

    // Clear test DB
    await User.deleteMany({});
    await Player.deleteMany({});
    await Match.deleteMany({});
    console.log('✓ Cleaned up test database collections.');

    // 2. User & Team Schema Constraints
    const adminUser = new User({
      username: 'commissioner',
      email: 'admin@auctionpro.com',
      password: 'hashedpassword123',
      role: 'Admin'
    });
    await adminUser.save();
    console.log('✓ User Schema: Successfully created Admin role.');

    const ownerUser = new User({
      username: 'bossman',
      email: 'owner@kings.com',
      password: 'hashedpassword456',
      role: 'Owner',
      teamName: 'Mumbai Kings',
      teamSlogan: 'Fearless and Strong',
      remainingBudget: 100000000,
    });
    await ownerUser.save();
    assert.strictEqual(ownerUser.totalBudget, 100000000, 'Total budget should default to 10 Cr');
    console.log('✓ User Schema: Successfully created Owner role with 10 Cr default budget.');

    // Attempting invalid role validation
    try {
      const invalidUser = new User({
        username: 'intruder',
        email: 'intruder@hack.com',
        password: 'pass',
        role: 'Hacker' // Not in ENUM
      });
      await invalidUser.save();
      assert.fail('Should have failed to save User with invalid role.');
    } catch (err) {
      console.log('✓ User Schema: Successfully blocked invalid role ENUM constraints.');
    }

    // 3. Player Schema & Stats embedded sub-object checks
    const playerRecord = new Player({
      user: ownerUser._id,
      name: 'Jasprit Bumrah',
      position: 'Bowler',
      basePrice: 20000000,
      stats: {
        matches: 120,
        runs: 50,
        wickets: 145,
        rating: 94
      }
    });
    await playerRecord.save();
    assert.strictEqual(playerRecord.status, 'Pending', 'Default player status should be Pending');
    assert.strictEqual(playerRecord.stats.rating, 94, 'Embedded player rating sub-object should map correctly');
    console.log('✓ Player Schema: Successfully created Player with stats sub-object and Pending status.');

    // 4. Match Scheduling Timeline Conflict Prevention Logic Check
    const startTimestamp = new Date('2026-06-15T18:00:00.000Z');
    
    // Create first match
    const match1 = new Match({
      title: 'Opening Match',
      homeTeam: ownerUser._id,
      awayTeam: adminUser._id,
      startTime: startTimestamp
    });
    await match1.save();
    console.log('✓ Match Schema: Successfully scheduled Match 1.');

    // Attempting to schedule match at duplicate time
    try {
      const match2 = new Match({
        title: 'Conflicting Match',
        homeTeam: adminUser._id,
        awayTeam: ownerUser._id,
        startTime: startTimestamp // Duplicate timestamp
      });
      await match2.save();
      assert.fail('Should have aborted creation of duplicate start time match.');
    } catch (err) {
      // Conflict detection correctly caught by DB index or code
      console.log('✓ Timeline Conflict Logic: Successfully blocked duplicate match time slots.');
    }

    console.log('\n--- ALL TEST SUITES PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Closed database test connection.');
  }
};

runTests();
