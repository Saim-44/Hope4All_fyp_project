import express from 'express';
import { signup, login, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController.js';

const router = express.Router();

// Signup route
router.post('/signup', signup);

// Login route
router.post('/login', login);

// Password Reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email Verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;
