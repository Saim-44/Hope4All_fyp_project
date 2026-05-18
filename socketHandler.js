import Message from './model/message_model.js';
import Notification from './model/notification_model.js';
import jwt from 'jsonwebtoken';

const activeUsers = new Map(); // socket.id -> {userId, role}

export const initSocket = (io) => {
  // Middleware for JWT Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.id} (User: ${userId})`);

    // Join user-specific room
    socket.join(userId.toString());
    activeUsers.set(socket.id, { userId, role: socket.user.role });

    // REAL-TIME ARCHITECTURE: 
    // Socket only handles broadcasting for immediate UI updates when API is bypassed
    // or for other real-time signals (typing, etc.)
    // DATABASE SAVING IS HANDLED BY API CONTROLLERS
    
    socket.on('send-message', async ({ receiverId, message, type = 'text' }) => {
      // This is a fallback or for special real-time only data
      // For production chat, we use the API to save and let the controller emit the event
      console.log(`[Socket] Received send-message from ${userId} to ${receiverId}`);
      
      // We don't save here anymore to prevent duplicates!
      // But we can broadcast if the API didn't for some reason (optional)
    });

    socket.on('get-online-status', (userIds) => {
      const onlineUsers = userIds.map(uid => ({
        userId: uid,
        online: Array.from(activeUsers.values()).some(u => u.userId.toString() === uid.toString())
      }));
      socket.emit('online-status', onlineUsers);
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      console.log('User disconnected:', socket.id);
    });
  });
};

export default initSocket;

