import Progress from '../model/progress_model.js';
import Orphan from '../model/orphan_model.js';

export const addProgress = async (req, res) => {
  try {
    const { orphanId, title, category, score, remarks, verifiedBy } = req.body;
    
    // Handle image upload if present
    const achievementImage = req.file ? (req.file.path || req.file.url || req.file.secure_url) : '';

    // First find the orphan profile using the provided ID (could be userId or profile _id)
    let orphan = await Orphan.findById(orphanId).catch(() => null);
    if (!orphan) {
      orphan = await Orphan.findOne({ userId: orphanId });
    }

    if (!orphan) {
      return res.status(404).json({ message: 'Orphan profile not found' });
    }

    const newProgress = new Progress({
      orphanId: orphan._id, // Use the MongoDB _id
      title,
      category,
      score,
      remarks,
      achievementImage,
      verifiedBy
    });

    await newProgress.save();
    res.status(201).json({ message: 'Progress report added successfully', progress: newProgress });
  } catch (error) {
    console.error('Error adding progress report:', error);
    res.status(500).json({ message: 'Error adding progress report', error: error.message });
  }
};

export const getOrphanProgress = async (req, res) => {
  try {
    const { orphanId } = req.params;
    
    // Find orphan first to allow lookups by userId
    let orphan = await Orphan.findById(orphanId).catch(() => null);
    if (!orphan) {
      orphan = await Orphan.findOne({ userId: orphanId });
    }

    if (!orphan) {
      return res.status(200).json({ progress: [] }); // If no profile, no progress
    }

    const progress = await Progress.find({ orphanId: orphan._id }).sort({ date: -1 });
    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress reports', error: error.message });
  }
};

export const deleteProgress = async (req, res) => {
  try {
    await Progress.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Progress report deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting progress report', error: error.message });
  }
};
