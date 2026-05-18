import mongoose from 'mongoose';
import Donor from '../model/donor_model.js';
import Donation from '../model/donation_model.js';
import Notification from '../model/notification_model.js';
import Request from '../model/request_model.js';
import Orphan from '../model/orphan_model.js';
import { convertPdfToImageUrl } from '../utils/fileUtils.js';


export const registerDonor = async (req, res) => {
  try {
    const { userId, name, email, phone, city, preferences } = req.body;

    // Basic validation
    if (!userId || !name || !phone) {
      return res.status(400).json({ message: 'Missing required fields: userId, name, or phone' });
    }

    // Check if userId is a valid ObjectId
    if (userId !== 'admin-fixed-id' && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    const updateData = {
      userId,
      name,
      phone,
      city: city || '',
      preferences: preferences || { causeType: [], schoolLevel: [], area: [] }
    };

    // Only add email if it's a valid, non-empty string
    // This prevents duplicate key errors on "" (empty string) due to unique indexes
    if (email && email.trim() !== '') {
      updateData.email = email;
    } else {
      // If no email, we use $unset to remove any existing empty string email
      // and prevent it from being set as "" in a new document
      updateData.$unset = { email: "" };
    }

    const donor = await Donor.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ message: 'Donor registered successfully', donor });
  } catch (error) {
    console.error('--- REGISTRATION ERROR DETAILS ---');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.errors) console.error('Validation Errors:', error.errors);
    console.error('');

    res.status(500).json({
      message: 'Error registering donor',
      error: error.message,
      type: error.name
    });
  }
};

// New registration endpoint with file uploads
export const registerDonorWithFiles = async (req, res) => {
  try {
    const { userId, name, email, phone, city } = req.body;

    // Create base donor object
    const donorData = {
      userId,
      name,
      email,
      phone,
      city,
    };

    // Handle profile picture upload
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      donorData.profilePic = req.files.profilePic[0].path;
    }

    // Handle document uploads
    if (req.files && req.files.documents) {
      const documents = req.files.documents.map(file => ({
        name: file.originalname,
        url: convertPdfToImageUrl(file.path),
        type: file.mimetype,
        uploadedAt: new Date()
      }));
      donorData.documents = documents;
    }

    const newDonor = new Donor(donorData);
    await newDonor.save();

    res.status(201).json({ message: 'Donor registered successfully', donor: newDonor });
  } catch (error) {
    res.status(500).json({ message: 'Error registering donor with files', error: error.message });
  }
};

export const getDonors = async (req, res) => {
  try {
    const donors = await Donor.find();
    res.status(200).json({ donors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donors', error: error.message });
  }
};


export const getDonorProfile = async (req, res) => {
  try {
    // Handle both userId and donorId parameters
    const { id } = req.params;
    let donor;

    // Check if it's a userId (string) or donorId (MongoDB ObjectId)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId, try as donorId first
      donor = await Donor.findById(id);
    }

    if (!donor) {
      // Try as userId
      donor = await Donor.findOne({ userId: id });
    }

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.status(200).json({ donor });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor profile', error: error.message });
  }
};

export const updateDonorProfile = async (req, res) => {
  try {
    const { name, email, phone, city, preferences, notificationSettings } = req.body;

    const supportedCategories = ['books', 'stationery', 'uniforms', 'school_fees', 'other'];
    if (preferences?.causeType) {
      const invalid = preferences.causeType.filter((c) => !supportedCategories.includes(c.toLowerCase()));
      if (invalid.length > 0) {
        return res.status(400).json({ message: `Invalid categories: ${invalid.join(', ')}` });
      }
    }

    const updateData = { name, email, phone, city, preferences, notificationSettings };

    // Handle profile picture upload
    if (req.files && req.files.profilePic && req.files.profilePic[0]) {
      updateData.profilePic = req.files.profilePic[0].path;
    }

    // Handle document uploads
    if (req.files && req.files.documents) {
      const documents = req.files.documents.map(file => ({
        name: file.originalname,
        url: convertPdfToImageUrl(file.path),
        type: file.mimetype,
        uploadedAt: new Date()
      }));

      // Get existing documents and append new ones
      const existingDonor = await Donor.findOne({ userId: req.params.id });
      if (existingDonor) {
        updateData.documents = [...(existingDonor.documents || []), ...documents];
      } else {
        updateData.documents = documents;
      }
    }

    const updatedDonor = await Donor.findOneAndUpdate(
      { userId: req.params.id },
      updateData,
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', donor: updatedDonor });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

export const makeDonation = async (req, res) => {
  try {
    console.log('Incoming Donation Request:', req.body);
    const { donorId, requestId, units, recipientName, type, description, unitType, itemName, city } = req.body;

    let donationData = {
      donorId,
      units,
      type: type || 'Other',
      description: description || '',
      unitType: unitType || 'Units',
      itemName: itemName || description,
      city: city || ''
    };

    if (requestId) {
      // Fetch the request to get details
      const request = await Request.findById(requestId).populate('orphanId', 'name');
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      donationData.requestId = requestId;
      donationData.recipientName = recipientName || (request.orphanId ? request.orphanId.name : 'Institutional');
      donationData.recipientId = request.orphanId ? request.orphanId._id : null;
      donationData.orphanageId = request.orphanageId; // Link to the orphanage

      // If it's a specific orphan, ensure we have their orphanage link too
      if (request.orphanId && !donationData.orphanageId) {
        const Orphan = mongoose.model('Orphan');
        const orphanDoc = await Orphan.findById(request.orphanId._id || request.orphanId);
        if (orphanDoc) donationData.orphanageId = orphanDoc.orphanageId;
      }

      if (type && request.type && type.toLowerCase() !== request.type.toLowerCase()) {
        console.log('[Donation] Type mismatch:', { sent: type, required: request.type });
        return res.status(400).json({ message: `Mismatch: This request is for ${request.type}, but you are donating ${type}.` });
      }

      donationData.type = type || request.type;
      donationData.unitType = unitType || request.unitType;

      await Request.findByIdAndUpdate(requestId, { status: 'pledged' });

      // Add orphan to donor's matched orphans if not already matched
      const donor = await Donor.findById(donorId);
      if (donor && request.orphanId) {
        const orphanIdStr = (request.orphanId._id || request.orphanId).toString();
        const alreadyMatched = donor.matchedOrphans.some(id => id.toString() === orphanIdStr);
        
        if (!alreadyMatched) {
          donor.matchedOrphans.push(request.orphanId._id || request.orphanId);
          await donor.save();
        }
      }
    } else {
      donationData.recipientName = recipientName || 'General Donation';
    }

    donationData.status = 'pending-approval';

    const donation = new Donation(donationData);
    await donation.save();

    // Update donor stats
    const unitsNum = Number(units) || 0;
    await Donor.findByIdAndUpdate(donorId, {
      $inc: { totalDonated: unitsNum, childrenHelped: requestId ? 1 : 0 }
    });

    // Create notification
    const notification = new Notification({
      donorId,
      type: 'delivery',
      title: 'Donation Recorded',
      message: `Your donation of ${units} ${donationData.unitType} has been recorded successfully.`,
    });

    await notification.save();

    res.status(201).json({ message: 'Donation successful', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error processing donation', error: error.message });
  }
};


export const getDonationHistory = async (req, res) => {
  try {
    // Handle both userId and donorId parameters
    const { id } = req.params;
    let donor;

    // Check if it's a userId (string) or donorId (MongoDB ObjectId)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId, try as donorId first
      donor = await Donor.findById(id);
    }

    if (!donor) {
      // Try as userId
      donor = await Donor.findOne({ userId: id });
    }

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const donations = await Donation.find({ donorId: donor._id })
      .populate('requestId', 'type unitType description school')
      .populate('recipientId')
      .sort({ createdAt: -1 });

    res.status(200).json({ donations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation history', error: error.message });
  }
};

// Get orphans that donor has donated to
export const getDonorOrphans = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.params.id })
      .populate('recipientId')
      .sort({ createdAt: -1 });

    // Get unique orphans
    const orphanMap = new Map();
    donations.forEach(donation => {
      if (donation.recipientId && !orphanMap.has(donation.recipientId._id.toString())) {
        orphanMap.set(donation.recipientId._id.toString(), donation.recipientId);
      }
    });

    const orphans = Array.from(orphanMap.values());
    res.status(200).json({ orphans });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor orphans', error: error.message });
  }
};

// Update donation
export const updateDonation = async (req, res) => {
  try {
    const { units, status } = req.body;

    const donation = await Donation.findById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Update donation
    if (units !== undefined) donation.units = units;
    if (status !== undefined) donation.status = status;

    await donation.save();

    res.status(200).json({ message: 'Donation updated successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donation', error: error.message });
  }
};

// Delete donation
export const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Update donor stats
    await Donor.findByIdAndUpdate(donation.donorId, {
      $inc: { totalDonated: -donation.units, childrenHelped: -1 }
    });

    res.status(200).json({ message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting donation', error: error.message });
  }
};


export const getNotifications = async (req, res) => {
  try {
    // Handle both userId and donorId parameters
    const { id } = req.params;
    let donor;

    // Check if it's a userId (string) or donorId (MongoDB ObjectId)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId, try as donorId first
      donor = await Donor.findById(id);
    }

    if (!donor) {
      // Try as userId
      donor = await Donor.findOne({ userId: id });
    }

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const notifications = await Notification.find({ donorId: donor._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { unread: false });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};


// Get matched orphans based on donor preferences
export const getMatchedOrphans = async (req, res) => {
  try {
    // Handle both userId and donorId parameters
    const { id } = req.params;
    let donor;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      donor = await Donor.findById(id);
    }

    if (!donor) {
      donor = await Donor.findOne({ userId: id });
    }

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const donorCity = donor.city?.toLowerCase();
    const preferredAreas = (donor.preferences?.area || []).map(a => a.toLowerCase());

    // Build filter for orphans
    let orphanFilter = {};
    
    // If donor has location preferences, filter orphans by city
    if (donorCity || preferredAreas.length > 0) {
      const locations = [donorCity, ...preferredAreas].filter(l => l);
      orphanFilter.location = { $in: locations.map(l => new RegExp(`^${l}$`, 'i')) };
    }

    const orphans = await Orphan.find(orphanFilter).populate('orphanageId').sort({ createdAt: -1 });
    res.status(200).json({ orphans });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matched orphans', error: error.message });
  }
};

export const getPreferenceOptions = async (req, res) => {
  try {
    const options = {
      causeTypes: ['School_Fees', 'Stationery', 'Uniforms', 'Books', 'Other'],
      schoolLevels: ['Primary', 'Secondary', 'Higher'],
      areas: ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad']
    };
    res.status(200).json({ options });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching preference options', error: error.message });
  }
};

export const approveDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.status(200).json({ message: 'Donor approved successfully', donor });
  } catch (error) {
    res.status(500).json({ message: 'Error approving donor', error: error.message });
  }
};

export const rejectDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.status(200).json({ message: 'Donor rejected', donor });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting donor', error: error.message });
  }
};

export const deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findOneAndDelete({ userId: req.params.id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.status(200).json({ message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting donor', error: error.message });
  }
};

// Get aid (donations) received by an orphan
export const getOrphanAid = async (req, res) => {
  try {
    const { id } = req.params;

    // First find the orphan profile using the provided ID (could be userId or profile _id)
    let orphan = await Orphan.findById(id).catch(() => null);
    if (!orphan) {
      orphan = await Orphan.findOne({ userId: id });
    }

    if (!orphan) {
      return res.status(404).json({ message: 'Orphan not found' });
    }

    const donations = await Donation.find({ recipientId: orphan._id })
      .populate('donorId')
      .populate('requestId', 'type units unitType description school')
      .sort({ createdAt: -1 });

    res.status(200).json({ donations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphan aid', error: error.message });
  }
};

export const uploadDonationPhoto = async (req, res) => {
  try {
    const { donationId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No photo provided' });
    }

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        donorImage: req.file.path,
        status: 'pending-approval'
      },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.status(200).json({ message: 'Photo uploaded successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
};
