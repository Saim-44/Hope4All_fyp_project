import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  name: { type: String,
    required: true },

  email: { type: String,
     required: false,
     default: '' },

  phone: { type: String,
     required: true },

  city: { type: String,
     default: '' },

  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'approved' },

  totalDonated: { type: Number,
     default: 0 },

  childrenHelped: { type: Number,
     default: 0 },

  memberSince: { type: Date,
    default: Date.now },

  preferences: {
    causeType: [{ type: String }],
    schoolLevel: [{ type: String }],
    area: [{ type: String }]
  },

  notificationSettings: {
    donationUpdates: { type: Boolean, default: true },
    impactReports: { type: Boolean, default: true },
    newOpportunities: { type: Boolean, default: true }
  },

  matchedOrphans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Orphan' }],

  profilePic: { type: String, default: '' },

  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date,
    default: Date.now },
});

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
