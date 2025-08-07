import * as nodemailer from 'nodemailer';

// Email configuration using AWS SES SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com', // AWS SES SMTP endpoint
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.AWS_SES_SMTP_USERNAME,
      pass: process.env.AWS_SES_SMTP_PASSWORD,
    },
  });
};

// Send email verification code
export async function sendVerificationEmail(email: string, verificationCode: string, firstName?: string) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@videotranscript.com',
      to: email,
      subject: 'Verify your VideoTranscript account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to VideoTranscript!</h2>
          ${firstName ? `<p>Hi ${firstName},</p>` : '<p>Hello,</p>'}
          <p>Thank you for creating an account with VideoTranscript. To complete your registration, please verify your email address using the code below:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; font-size: 24px; letter-spacing: 3px; margin: 0;">${verificationCode}</h3>
          </div>
          
          <p>This verification code will expire in 24 hours.</p>
          
          <p>If you didn't create an account with VideoTranscript, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            This email was sent by VideoTranscript<br>
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
      text: `
        Welcome to VideoTranscript!
        
        ${firstName ? `Hi ${firstName},` : 'Hello,'}
        
        Thank you for creating an account. To verify your email address, please use this code: ${verificationCode}
        
        This code will expire in 24 hours.
        
        If you didn't create an account with VideoTranscript, you can ignore this email.
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send password reset email (for future use)
export async function sendPasswordResetEmail(email: string, resetToken: string, firstName?: string) {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'https://videotranscript.com'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@videotranscript.com',
      to: email,
      subject: 'Reset your VideoTranscript password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          ${firstName ? `<p>Hi ${firstName},</p>` : '<p>Hello,</p>'}
          <p>We received a request to reset your password for your VideoTranscript account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            This email was sent by VideoTranscript
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}