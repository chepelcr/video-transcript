import nodemailer from 'nodemailer';
import { APP_CONFIG } from '../config/app';

export interface IEmailService {
  sendVerificationEmail(to: string, verificationCode: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>;
}

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.AWS_SES_SMTP_USERNAME,
        pass: process.env.AWS_SES_SMTP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(to: string, verificationCode: string): Promise<boolean> {
    try {
      console.log(`📧 Sending verification email to: ${to}`);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@video-transcript.jcampos.dev',
        to,
        subject: 'Verify Your Email - Video Transcript',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">
              Thank you for registering with Video Transcript. Please use the verification code below to verify your email address:
            </p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #007bff; font-size: 24px; letter-spacing: 3px; margin: 0;">
                ${verificationCode}
              </h3>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Video Transcript - Intelligent Video Transcription Service
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to: ${to}`);
      return true;
      
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    try {
      console.log(`🔑 Sending password reset email to: ${to}`);
      
      const resetUrl = `${APP_CONFIG.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@video-transcript.jcampos.dev',
        to,
        subject: 'Reset Your Password - Video Transcript',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Password Reset</h2>
            <p style="color: #666; font-size: 16px;">
              You requested to reset your password for your Video Transcript account. Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #007bff; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Video Transcript - Intelligent Video Transcription Service
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${to}`);
      return true;
      
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }
}