import mongoose from 'mongoose';
import Orphan from '../model/orphan_model.js';
import Donation from '../model/donation_model.js';
import User from '../model/user_model.js';
import { convertPdfToImageUrl } from '../utils/fileUtils.js';

export const registerOrphan = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('[RegisterOrphan] Request for UserID:', userId);
    console.log('[RegisterOrphan] Files:', req.files);

    // Check if profile already exists
    const existingOrphan = await Orphan.findOne({ userId });
    if (existingOrphan) {
      console.log('[RegisterOrphan] Profile already exists');
      return res.status(400).json({ message: 'Orphan profile already exists' });
    }

    const { name, age, gender, location, orphanageId, phone, school, classLevel, bio, cnicOrBForm } = req.body;
    
    // Check files presence - handle various Cloudinary/Multer response structures
    const profilePic = req.files?.profilePic?.[0] 
      ? (req.files.profilePic[0].path || req.files.profilePic[0].url || req.files.profilePic[0].secure_url) 
      : '';
      
    const supportingDocs = convertPdfToImageUrl(req.files?.supportingDocs?.[0]
      ? (req.files.supportingDocs[0].path || req.files.supportingDocs[0].url || req.files.supportingDocs[0].secure_url)
      : '');
  
    const bFormDoc = convertPdfToImageUrl(req.files?.bFormDoc?.[0]
      ? (req.files.bFormDoc[0].path || req.files.bFormDoc[0].url || req.files.bFormDoc[0].secure_url)
      : '');

    console.log('[RegisterOrphan] Detetcted Paths:', { profilePic, supportingDocs });

    const newOrphan = new Orphan({
      userId,
      name,
      age,
      gender,
      location,
      phone,
      school,
      classLevel,
      bio,
      cnicOrBForm,
      orphanageId: orphanageId || undefined,
      profilePic,
      supportingDocs,
      bFormDoc,
    });

    await newOrphan.save();
    
    // Update User status to pending for admin approval
    await User.findByIdAndUpdate(userId, { status: 'pending' });

    console.log('[RegisterOrphan] Successfully saved profile for:', name);
    res.status(201).json({ message: 'Orphan registered successfully', orphan: newOrphan });
  } catch (error) {
    console.error('[RegisterOrphan] DATABASE ERROR:', error);
    res.status(500).json({ 
      message: 'Error registering orphan', 
      error: error.message,
      details: error.errors // Include Mongoose validation details if any
    });
  }
};

export const getOrphanProfile = async (req, res) => {
  try {
    const orphan = await Orphan.findOne({ userId: req.params.id }).populate('orphanageId');
    if (!orphan) {
      return res.status(404).json({ message: 'Orphan not found' });
    }
    res.status(200).json({ orphan });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphan profile', error: error.message });
  }
};

export const updateOrphanProfile = async (req, res) => {
  try {
    const { id } = req.params; // userId
    const updateData = { ...req.body };

    // Handle file updates if provided
    if (req.files) {
      if (req.files.profilePic) {
        updateData.profilePic = req.files.profilePic[0].path || req.files.profilePic[0].url || req.files.profilePic[0].secure_url;
      }
      if (req.files.supportingDocs) {
        updateData.supportingDocs = convertPdfToImageUrl(req.files.supportingDocs[0].path || req.files.supportingDocs[0].url || req.files.supportingDocs[0].secure_url);
      }
      if (req.files.bFormDoc) {
        updateData.bFormDoc = convertPdfToImageUrl(req.files.bFormDoc[0].path || req.files.bFormDoc[0].url || req.files.bFormDoc[0].secure_url);
      }
    }

    const updatedOrphan = await Orphan.findOneAndUpdate(
      { userId: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrphan) {
      return res.status(404).json({ message: 'Orphan profile not found' });
    }

    console.log('[UpdateOrphan] Successfully updated profile for:', updatedOrphan.name);
    res.status(200).json({ message: 'Profile updated successfully', orphan: updatedOrphan });
  } catch (error) {
    console.error('[UpdateOrphan] Error:', error);
    res.status(500).json({ message: 'Error updating orphan profile', error: error.message });
  }
};


export const reportDonationIssue = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { reason } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = 'not-received';
    await donation.save();

    // Create notification for admin/donor
    const Notification = mongoose.model('Notification');
    const issueNotification = new Notification({
      donorId: donation.donorId,
      type: 'alert',
      title: 'Delivery Issue Reported',
      message: `An issue was reported for your donation. The recipient marked it as not received. Reason: ${reason || 'Not provided'}`,
    });
    await issueNotification.save();

    res.status(200).json({ message: 'Issue reported successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting issue', error: error.message });
  }
};
export const confirmReceipt = async (req, res) => {
  try {
    const { donationId } = req.params;
    const receivedImage = req.file ? req.file.path : null;

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { 
        status: 'received', 
        receivedImage,
        deliveredAt: new Date()
      },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Create notifications
    const Notification = mongoose.model('Notification');
    
    // Notification for donor
    const donorNotif = new Notification({
      donorId: donation.donorId,
      type: 'delivery',
      title: 'Donation Received!',
      message: `Your donation has been successfully received by the recipient. Thank you for your support!`,
    });
    await donorNotif.save();

    // Notification for admin
    const adminNotif = new Notification({
      type: 'request',
      title: 'Donation Delivery Confirmed',
      message: `Donation ${donationId} has been marked as received by the orphan.`,
    });
    await adminNotif.save();

    res.status(200).json({ message: 'Donation marked as received', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming receipt', error: error.message });
  }
};
