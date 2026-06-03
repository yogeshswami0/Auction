import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    enum: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  photo: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Available', 'Live', 'Sold', 'Unsold'],
    default: 'Pending',
    required: true,
  },
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  // AI fields
  scoutingReport: {
    type: String,
    default: '',
  },
  predictedValue: {
    type: String,
    default: '',
  },
  biddingVibe: {
    type: String,
    default: '',
  },
  // Live auction execution fields
  currentBid: {
    type: Number,
    default: 0,
  },
  currentBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  finalSalePrice: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Player', PlayerSchema);
