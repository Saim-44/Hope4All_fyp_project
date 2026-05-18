import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  orphanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orphan', required: false },
  orphanageId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrphanAge', required: true },
  isInstitutional: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  type: { type: String, required: true, enum: ['school_fees', 'stationery', 'uniforms', 'books', 'other'] },
  units: { type: Number, required: true },
  unitType: { type: String, required: true },
  description: { type: String, required: true },
  school: { type: String, required: false },
  class: { type: String, required: false },
  status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'pledged', 'fulfilled'], default: 'pending' },
  adminComments: { type: String, required: false },
  documents: [{ type: String }], 
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Request = mongoose.model('Request', requestSchema);

export default Request;
