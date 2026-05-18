import User from '../model/user_model.js';
import Donor from '../model/donor_model.js';
import Orphan from '../model/orphan_model.js';
import OrphanAge from '../model/orphan_age.js';
import Donation from '../model/donation_model.js';
import Request from '../model/request_model.js';
import Inventory from '../model/inventory_model.js';
import Notification from '../model/notification_model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalOrphans = await User.countDocuments({ role: 'orphan' });
    const totalOrphanages = await User.countDocuments({ role: 'orphanage' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });

    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const lowStockItems = await Inventory.countDocuments({
      $expr: { $lte: ['$quantity', '$minThreshold'] }
    });

    const recentDonations = await Donation.find()
      .populate('donorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrphans = await User.find({ role: 'orphan' }).sort({ createdAt: -1 }).limit(5);
    const recentDonors = await User.find({ role: 'donor' }).sort({ createdAt: -1 }).limit(5);
    const recentOrphanages = await User.find({ role: 'orphanage' }).sort({ createdAt: -1 }).limit(5);
    const recentVolunteers = await User.find({ role: 'volunteer' }).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      stats: {
        totalUsers,
        totalDonors,
        totalOrphans,
        totalOrphanages,
        totalVolunteers,
        pendingRequests,
        totalDonations: totalDonations[0]?.total || 0,
        lowStockItems,
      },
      recentDonations,
      recentOrphans,
      recentDonors,
      recentOrphanages,
      recentVolunteers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const usersWithData = await Promise.all(users.map(async (user) => {
      let additionalData = {};
      if (user.role === 'orphan') {
        const orphan = await Orphan.findOne({ userId: user._id });
        if (orphan) {
          additionalData = {
            name: orphan.name,
            age: orphan.age,
            gender: orphan.gender,
            location: orphan.location,
            profilePic: orphan.profilePic,
            supportingDocs: orphan.supportingDocs,
            bFormDoc: orphan.bFormDoc,
            bio: orphan.bio,
            phone: orphan.phone,
          };
        }
      } else if (user.role === 'donor') {
        const donor = await Donor.findOne({ userId: user._id });
        if (donor) {
          additionalData = {
            name: donor.name,
            email: donor.email,
            phone: donor.phone,
            city: donor.city,
            profilePic: donor.profilePic,
            documents: donor.documents,
          };
        }
      } else if (user.role === 'orphanage') {
        const orphanage = await OrphanAge.findOne({ userId: user._id });
        if (orphanage) {
          additionalData = {
            name: orphanage.name,
            location: orphanage.location,
            phone: orphanage.contactInfo?.phone,
            city: orphanage.location?.city,
            // Use first building image as profile pic if available
            profilePic: orphanage.documents?.buildingImages?.[0] || null,
            documents: orphanage.documents,
          };
        }
      }
      // Add for other roles if models exist
      return { ...user.toObject(), ...additionalData };
    }));
    res.status(200).json({ users: usersWithData });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (!req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { userId } = req.params;

    if (!userId || userId === 'null' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user is an orphanage and status is verified, approve all pending requests for this orphanage
    if (updatedUser.role === 'orphanage' && status === 'verified') {
      const orphanage = await OrphanAge.findOne({ userId: updatedUser._id });
      if (orphanage) {
        await Request.updateMany(
          { orphanageId: orphanage._id, status: 'pending' },
          { status: 'approved' }
        );
        await OrphanAge.findOneAndUpdate({ userId: updatedUser._id }, { status: 'approved' });
      }
    }

    // Sync Donor status
    if (updatedUser.role === 'donor' && status === 'verified') {
      await Donor.findOneAndUpdate({ userId: updatedUser._id }, { status: 'approved' });
    }

    res.status(200).json({ message: 'User status updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};

export const getReportsData = async (req, res) => {
  try {
    // Donation trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const donationTrends = await Donation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // User activity breakdown
    const userActivity = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Request status breakdown
    const requestStatus = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Key metrics calculations
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const activeUsers = await User.countDocuments({ status: 'active' });

    const totalRequests = await Request.countDocuments();
    const approvedRequests = await Request.countDocuments({ status: 'approved' });
    const successRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Average response time (in days) for approved/rejected requests
    const avgResponseTimeResult = await Request.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] },
          updatedAt: { $exists: true },
          createdAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTime = avgResponseTimeResult.length > 0 ? avgResponseTimeResult[0].avgResponseTime : 0;

    res.status(200).json({
      donationTrends,
      userActivity,
      requestStatus,
      keyMetrics: {
        totalDonations: totalDonations[0]?.total || 0,
        activeUsers,
        successRate: Math.round(successRate * 100) / 100, 
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports data', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { read: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

export const getAllOrphans = async (req, res) => {
  try {
    const orphans = await Orphan.find().sort({ createdAt: -1 });
    res.status(200).json({ orphans });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphans', error: error.message });
  }
};

export const getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.status(200).json({ donors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donors', error: error.message });
  }
};

export const getAllOrphanages = async (req, res) => {
  try {
    const orphanages = await OrphanAge.find().sort({ createdAt: -1 });
    res.status(200).json({ orphanages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphanages', error: error.message });
  }
};

export const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ volunteers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
};

export const getOrphanById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const orphan = await Orphan.findById(req.params.id);
    if (!orphan) {
      return res.status(404).json({ message: 'Orphan not found' });
    }
    res.status(200).json({ orphan });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphan', error: error.message });
  }
};

export const getDonorById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.status(200).json({ donor });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor', error: error.message });
  }
};

export const getOrphanageById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const orphanage = await OrphanAge.findById(req.params.id);
    if (!orphanage) {
      return res.status(404).json({ message: 'Orphanage not found' });
    }
    res.status(200).json({ orphanage });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orphanage', error: error.message });
  }
};

export const getVolunteerById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    const volunteer = await User.findOne({ _id: req.params.id, role: 'volunteer' }).select('-password');
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    res.status(200).json({ volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteer', error: error.message });
  }
};

export const testEndpoint = async (req, res) => {
  try {
    res.status(200).json({ message: 'Test successful' });
  } catch (error) {
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
};

export const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email')
      .populate('recipientId', 'name age')
      .populate('requestId', 'type units unitType description')
      .sort({ createdAt: -1 });
    res.status(200).json({ donations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
};

// Suspend a user (donor, orphan, orphanage, volunteer) with a reason
export const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Suspension reason is required.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'suspended', suspensionReason: reason.trim() },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Global suspension: update status in related models
    if (user.role === 'donor') {
      await Donor.findOneAndUpdate({ userId: user._id }, { status: 'suspended' });
    } else if (user.role === 'orphanage') {
      await OrphanAge.findOneAndUpdate({ userId: user._id }, { status: 'suspended' });
    }

    res.status(200).json({ message: 'User suspended successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending user', error: error.message });
  }
};

// Unsuspend / lift suspension from a user
export const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'verified', suspensionReason: '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Restore status in related models
    if (user.role === 'donor') {
      await Donor.findOneAndUpdate({ userId: user._id }, { status: 'approved' });
    } else if (user.role === 'orphanage') {
      await OrphanAge.findOneAndUpdate({ userId: user._id }, { status: 'approved' });
    }

    res.status(200).json({ message: 'User unsuspended successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error unsuspending user', error: error.message });
  }
};
// Forward donation to orphan (from approved to in-transit)
export const forwardDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { status: 'in-transit' },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Create notification for orphan
    const notification = new Notification({
      recipientId: donation.recipientId,
      type: 'delivery',
      title: 'Donation En Route',
      message: `A donation of ${donation.units} ${donation.unitType} is now in transit to you.`,
    });

    await notification.save();

    res.status(200).json({ message: 'Donation status updated to in-transit', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donation status', error: error.message });
  }
};

export const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status } = req.body;

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { status },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.status(200).json({ message: `Donation status updated to ${status}`, donation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating donation status', error: error.message });
  }
};

// Mark donation as completed
export const completeDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { status: 'completed', deliveredAt: new Date() },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Create notification for donor
    const notification = new Notification({
      donorId: donation.donorId,
      type: 'delivery',
      title: 'Donation Completed',
      message: `Your donation of ${donation.units} ${donation.unitType} has been successfully delivered and completed. Thank you!`,
    });

    await notification.save();

    res.status(200).json({ message: 'Donation marked as completed', donation });
  } catch (error) {
    res.status(500).json({ message: 'Error completing donation', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete associated profile data
    if (user.role === 'donor') {
      await Donor.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'orphan') {
      await Orphan.findOneAndDelete({ userId: user._id });
    } else if (user.role === 'orphanage') {
      await OrphanAge.findOneAndDelete({ userId: user._id });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User and associated profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
