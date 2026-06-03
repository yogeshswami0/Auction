import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'Owner', 'Player'],
    required: true,
  },
  // Owner franchise tracking fields
  teamName: {
    type: String,
    default: '',
  },
  teamLogo: {
    type: String,
    default: '',
  },
  teamSlogan: {
    type: String,
    default: '',
  },
  totalBudget: {
    type: Number,
    default: 100000000, // 10 Cr (100 Million)
  },
  remainingBudget: {
    type: Number,
    default: 100000000,
  },
  squad: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
}, {
  timestamps: true,
});

export default mongoose.model('User', UserSchema);
