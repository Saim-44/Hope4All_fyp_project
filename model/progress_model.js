import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  orphanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orphan',
    required: true
  },
  title: {
    type: String,
    required: true // e.g., "Term 1 Final Results"
  },
  category: {
    type: String,
    enum: ['Academic', 'Sports', 'Behavioral', 'Health'],
    default: 'Academic'
  },
  score: {
    type: String, // e.g., "A", "85%", "Pass"
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    required: false
  },
  achievementImage: {
    type: String,
    required: false
  },
  verifiedBy: {
    type: String, // Name or ID of the volunteer/admin
    required: false
  }
}, {
  timestamps: true
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
