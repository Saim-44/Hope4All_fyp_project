import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },

  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: false
  },

  type: {
    type: String,
    required: true,
    default: 'Other'
  },

  itemName: {
    type: String,
    required: false
  },

  description: {
    type: String
  },

  units: {
    type: Number,
    required: true
  },

  unitType: {
    type: String,
    default: 'Units'
  },

  recipientName: {
    type: String,
    required: false
  },

  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orphan'
  },

  orphanageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrphanAge'
  },

  city: {
    type: String,
    required: false
  },

  status: {
    type: String,
    enum: ['pending-approval', 'approved', 'in-transit', 'received', 'rejected'],
    default: 'pending-approval'
  },
  
  donorImage: {
    type: String,
    required: false
  },

  receivedImage: {
    type: String,
    required: false
  },

  receipt: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  deliveredAt: {
    type: Date
  }
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
