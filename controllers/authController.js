
import User from '../model/user_model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOTPEmail, sendVerificationEmail } from '../utils/emailService.js';

export const signup = async (req, res) => {
  try {
  
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      console.log(' User with email already exists:', email);
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Check if user already exists by username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      console.log(' User with username already exists:', username);
      return res.status(400).json({ success: false, message: 'User with this username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (Directly Verified)
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      status: 'verified', 
      isEmailVerified: true
    });

    console.log(' [Auth] Creating verified user:', { username, email, role });
    await newUser.save();

    // Generate Token for auto-login
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role, status: newUser.status }
    });
  } catch (error) {
    console.error(' Error registering user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user', 
      error: error.message 
    });
  }
};


// Login user

export const login = async (req, res) => {
  try {
    console.log(' Login request received:', { email: req.body.email });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log(' Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error(' JWT_SECRET is not configured');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    // Special handling for admin login
    if (email === 'nasirzia171@gmail.com' && password === 'Lakki123,.') {
      console.log(' Admin login detected');
      
      // Create admin user object
      const adminUser = {
        _id: 'admin-fixed-id',
        username: 'Admin',
        email: 'nasir171@gmail.com',
        role: 'admin'
      };

      // Generate JWT for admin
      const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      console.log(' Admin login successful');
      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        user: adminUser
      });
    }

    // Normal user authentication
    console.log(`[Auth] Attempting login for email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`[Auth] User NOT found in database: ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log(`[Auth] User found: ${user.username} (${user.role}). Verifying password...`);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[Auth] Password mismatch for user: ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT
    console.log(' Generating JWT token...');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      token, 
      user: { id: user._id, username: user.username, email: user.email, role: user.role, status: user.status, suspensionReason: user.suspensionReason || '' } 
    });
  } catch (error) {
    console.error(' Error logging in:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error logging in', 
      error: error.message 
    });
  }
};

// Verify Email OTP
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      verificationOTP: otp,
      verificationOTPExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.status = user.role === 'donor' ? 'verified' : 'pending'; // Donors auto-verify after email, others need admin
    user.verificationOTP = undefined;
    user.verificationOTPExpiry = undefined;
    await user.save();

    // Generate token for automatic login after verification
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully', 
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    console.error('Verify Email error:', error);
    res.status(500).json({ success: false, message: 'Error verifying email' });
  }
};

// Resend Verification OTP
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = verificationOTP;
    user.verificationOTPExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    console.log(`[Auth] Resending Verification OTP for ${email}: ${verificationOTP}`);
    const emailSent = await sendVerificationEmail(user.email, verificationOTP);

    if (emailSent) {
      res.status(200).json({ success: true, message: 'New verification code sent' });
    } else {
      res.status(500).json({ success: false, message: 'Error sending email' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = otp;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`[Auth] OTP for ${email}: ${otp}`);

    // Send the actual email
    const emailSent = await sendOTPEmail(user.email, otp);

    if (emailSent) {
      res.status(200).json({ success: true, message: 'OTP sent to your email' });
    } else {
      res.status(500).json({ success: false, message: 'Error sending email. Please try again later.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      resetToken: otp,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


