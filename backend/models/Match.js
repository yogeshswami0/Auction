import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
    unique: true, // critical unique structural validation field to isolate timeline data mutations
  },
}, {
  timestamps: true,
});

// critical unique structural validation field is handled at field definition level above.

export default mongoose.model('Match', MatchSchema);
