/**
 * Email Service (Development Mode)
 * This service just logs the OTP to the console instead of sending real emails.
 * This prevents authentication issues during development.
 */

export const sendOTPEmail = async (email, otp) => {
  console.log('\n=======================================');
  console.log(`[EMAIL SIMULATOR] To: ${email}`);
  console.log(`[EMAIL SIMULATOR] Subject: Your Password Reset OTP`);
  console.log(`[EMAIL SIMULATOR] Message: Your OTP is ${otp}`);
  console.log('=======================================\n');
  
  return true; // Always return success in dev mode
};

export const sendVerificationEmail = async (email, otp) => {
  console.log('\n=======================================');
  console.log(`[EMAIL SIMULATOR] To: ${email}`);
  console.log(`[EMAIL SIMULATOR] Subject: Verify Your Email`);
  console.log(`[EMAIL SIMULATOR] Message: Your verification code is ${otp}`);
  console.log('=======================================\n');

  return true; // Always return success in dev mode
};
