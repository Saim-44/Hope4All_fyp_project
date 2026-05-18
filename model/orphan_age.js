import mongoose from "mongoose";

const orphanageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  establishedYear: {
    type: Number,
    required: false,
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
  },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  capacity: {
    current: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  facilities: [{
    type: String,
    required: false,
  }],
  managerName: {
    type: String,
    required: false,
    trim: true,
  },
  staffCount: {
    type: Number,
    required: false,
  },
  documents: {
    registrationCert: {
      type: String,
      required: false,
    },
    buildingImages: [{
      type: String,
      required: false,
    }],
  },
}, {
  timestamps: true,
});

const OrphanAge = mongoose.model("OrphanAge", orphanageSchema);

export default OrphanAge;
