import Message from '../model/message_model.js';
import User from '../model/user_model.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, type } = req.body;
    const senderId = req.user.id;

    console.log(`[Message] Attempting to send from ${senderId} to ${receiverId}`);
    console.log(`[Message] Content: "${message?.substring(0, 20)}..."`);

    if (!receiverId) {
      return res.status(400).json({ success: false, error: 'ReceiverId is required' });
    }

    if (!message && !req.file) {
      return res.status(400).json({ success: false, error: 'Message or file is required' });
    }

    let fileUrl = '';
    let fileName = '';
    let finalType = type || 'text';

    if (req.file) {
      fileUrl = req.file.path || req.file.url || req.file.secure_url;
      fileName = req.file.originalname;
      // Infer type from mimetype
      if (req.file.mimetype.startsWith('image/')) {
        finalType = 'image';
      } else {
        finalType = 'file';
      }
    }

    const newMessage = new Message({
      senderId, 
      receiverId,
      message: message || '',
      type: finalType,
      fileUrl,
      fileName,
    });

    await newMessage.save();
    console.log(`[Message] Saved to DB with ID: ${newMessage._id} (Type: ${finalType})`);
    
    await newMessage.populate('senderId', 'username role');

    // Real-time emit to receiver room
    if (req.io) {
      const roomName = receiverId.toString();
      req.io.to(roomName).emit('new-message', newMessage);
      console.log(`[Socket] Emitted 'new-message' to room: ${roomName}`);
    } else {
      console.warn('[Socket] req.io not found! Real-time delivery skipped.');
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('[Message] Send error:', error);
    res.status(500).json({ success: false, error: 'Error sending message', details: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id }
      ]
    })
    .populate('senderId', 'username role')
    .populate('receiverId', 'username role')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Get unique conversation partners from existing messages
    const sentMessages = await Message.find({ senderId: userId }).distinct('receiverId');
    const receivedMessages = await Message.find({ receiverId: userId }).distinct('senderId');
    
    let conversationUserIds = [...new Set([...sentMessages, ...receivedMessages])];

    // 2. Role-based expansion
    if (userRole === 'donor') {
      const allOrphans = await User.find({ role: 'orphan' }).distinct('_id');
      conversationUserIds = [...new Set([...conversationUserIds, ...allOrphans])];
    } else if (userRole === 'volunteer') {
      const allOthers = await User.find({ role: { $in: ['donor', 'admin', 'orphan'] } }).distinct('_id');
      conversationUserIds = [...new Set([...conversationUserIds, ...allOthers])];
    }

    // 3. Fetch user details for all identified IDs
    const conversations = await User.find({ 
      _id: { $in: conversationUserIds },
      // status: 'verified' // Optional: filter by status
    })
      .select('username role')
      .lean();

    // 4. Add last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: user._id },
            { senderId: user._id, receiverId: userId }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: userId,
          read: false
        });

        return {
          user,
          lastMessage,
          unreadCount
        };
      })
    );

    // 5. Sort: Conversations with messages first (by date), then alphabetical
    conversationsWithDetails.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.user.username.localeCompare(b.user.username);
    });

    res.status(200).json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations', error: error.message });
  }
};

export const markMessagesRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;

    await Message.updateMany(
      { senderId: otherUserId, receiverId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};
