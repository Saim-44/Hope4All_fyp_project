import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, default: 'other' },
  school: { type: String, default: 'N/A' },
  orphanageId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrphanAge', required: false },
  date: { type: Date, default: Date.now },
  status: { type: String, required: true, enum: ['assigned', 'in_progress', 'completed', 'cancelled'], default: 'assigned' },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  notes: { type: String, required: false },
  proofImage: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
