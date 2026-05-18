import Notification from '../model/notification_model.js';
import Donor from '../model/donor_model.js'; 

export const createNotification = async (req, res) => {
  try {
    const { donorId, type, title, message } = req.body;

    const notification = new Notification({
      donorId,
      type,
      title,
      message,
    });

    await notification.save();

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const donorId = req.user.id || req.params.donorId; 

    const notifications = await Notification.find({ donorId })
      .sort({ createdAt: -1 });

    // Mark as read
    await Notification.updateMany({ donorId, unread: true }, { unread: false });

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, { unread: false });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

