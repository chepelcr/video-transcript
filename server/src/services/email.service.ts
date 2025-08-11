import nodemailer from 'nodemailer';
import { APP_CONFIG } from '../config/app';
import { AWSSecretsService } from './aws-secrets.service';

export interface IEmailService {
  sendVerificationEmail(to: string, verificationCode: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>;
  sendWelcomeEmail(to: string, firstName?: string, lastName?: string, language?: string): Promise<boolean>;
}

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private awsSecretsService: AWSSecretsService;

  constructor() {
    this.awsSecretsService = new AWSSecretsService();
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

  /**
   * Get transporter with AWS Secrets Manager fallback
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    try {
      // Try to get credentials from AWS Secrets Manager
      const smtpCredentials = await this.awsSecretsService.getSMTPCredentials();
      
      const transporter = nodemailer.createTransport({
        host: smtpCredentials.host,
        port: parseInt(smtpCredentials.port),
        secure: false,
        auth: {
          user: smtpCredentials.user,
          pass: smtpCredentials.password,
        },
      });
      
      console.log('📧 Using AWS Secrets Manager for SMTP credentials');
      return transporter;
      
    } catch (error) {
      console.warn('⚠️ Failed to get SMTP credentials from AWS Secrets Manager, using environment variables');
      return this.transporter;
    }
  }

  async sendVerificationEmail(to: string, verificationCode: string): Promise<boolean> {
    try {
      console.log(`📧 Sending verification email to: ${to}`);
      
      const transporter = await this.getTransporter();
      const fromEmail = process.env.FROM_EMAIL || 'noreply@jcampos.dev';
      
      const mailOptions = {
        from: fromEmail,
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

      await transporter.sendMail(mailOptions);
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
      
      const transporter = await this.getTransporter();
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const fromEmail = process.env.FROM_EMAIL || 'noreply@jcampos.dev';
      
      const mailOptions = {
        from: fromEmail,
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

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${to}`);
      return true;
      
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, firstName?: string, lastName?: string, language: string = 'en'): Promise<boolean> {
    try {
      console.log(`🎉 Sending welcome email to: ${to}`);
      
      const transporter = await this.getTransporter();
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || (language === 'es' ? 'Usuario' : 'User');
      const emailContent = this.getWelcomeEmailContent(fullName, language);
      
      // Get FROM_EMAIL from environment variable or use verified AWS SES email
      const fromEmail = process.env.FROM_EMAIL || 'noreply@jcampos.dev';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject: emailContent.subject,
        html: emailContent.html,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to: ${to}`);
      return true;
      
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Get welcome email content based on language
   */
  private getWelcomeEmailContent(fullName: string, language: string): { subject: string; html: string } {
    if (language === 'es') {
      return {
        subject: '¡Bienvenido a VideoScript - Comienza tu Viaje de Transcripción de Videos!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; font-size: 28px; margin: 0; font-weight: bold;">
                  ¡Bienvenido a VideoScript! 🎉
                </h1>
                <p style="color: #7f8c8d; font-size: 16px; margin-top: 10px;">
                  Tu servicio inteligente de transcripción de videos
                </p>
              </div>

              <!-- Personal Greeting -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #34495e; font-size: 20px; margin-bottom: 15px;">
                  ¡Hola ${fullName}!
                </h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: justify;">
                  ¡Gracias por unirte a VideoScript! Estamos emocionados de ayudarte a transformar tus videos en transcripciones precisas y buscables con el poder de la IA.
                </p>
              </div>

              <!-- Features Section -->
              <div style="background-color: #ecf0f1; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #2c3e50; font-size: 18px; margin-bottom: 20px; text-align: center;">
                  🚀 Qué puedes hacer con VideoScript:
                </h3>
                <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Transcripción Rápida:</strong> Convierte videos a texto en minutos</li>
                  <li><strong>Múltiples Formatos:</strong> Compatible con YouTube, Vimeo y archivos de video directos</li>
                  <li><strong>Alta Precisión:</strong> Transcripción con IA con más del 95% de precisión</li>
                  <li><strong>Exportación Fácil:</strong> Descarga transcripciones como archivos de texto o copia al portapapeles</li>
                  <li><strong>Panel en Tiempo Real:</strong> Rastrea todas tus transcripciones en un solo lugar</li>
                </ul>
              </div>

              <!-- Free Trial Info -->
              <div style="background-color: #e8f5e8; border-left: 4px solid #27ae60; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #27ae60; font-size: 16px; margin: 0 0 10px 0;">
                  🎁 Tu Prueba Gratuita Incluye:
                </h3>
                <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5; text-align: justify;">
                  <strong>3 transcripciones gratuitas por día</strong> para comenzar! No se requiere tarjeta de crédito. 
                  Experimenta todo el poder de VideoScript antes de decidir actualizar.
                </p>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://video-transcript.jcampos.dev'}/es" 
                   style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Comienza tu Primera Transcripción
                </a>
              </div>

              <!-- Support Section -->
              <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                <p style="color: #7f8c8d; font-size: 14px; margin: 0 0 10px 0;">
                  ¿Necesitas ayuda para comenzar? ¡Estamos aquí para apoyarte!
                </p>
                <p style="color: #555; font-size: 13px; margin: 0;">
                  Consulta nuestra documentación o contacta a nuestro equipo de soporte si tienes alguna pregunta.
                </p>
              </div>

              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <div style="text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  VideoScript - Servicio Inteligente de Transcripción de Videos<br>
                  Construido con ❤️ para creadores de contenido y profesionales
                </p>
              </div>
            </div>
          </div>
        `
      };
    }

    // Default English content
    return {
      subject: 'Welcome to VideoScript - Your Video Transcription Journey Begins!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; font-size: 28px; margin: 0; font-weight: bold;">
                Welcome to VideoScript! 🎉
              </h1>
              <p style="color: #7f8c8d; font-size: 16px; margin-top: 10px;">
                Your intelligent video transcription service
              </p>
            </div>

            <!-- Personal Greeting -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #34495e; font-size: 20px; margin-bottom: 15px;">
                Hello ${fullName}!
              </h2>
              <p style="color: #555; font-size: 16px; line-height: 1.6; text-align: justify;">
                Thank you for joining VideoScript! We're excited to help you transform your videos into accurate, searchable transcripts with the power of AI.
              </p>
            </div>

            <!-- Features Section -->
            <div style="background-color: #ecf0f1; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #2c3e50; font-size: 18px; margin-bottom: 20px; text-align: center;">
                🚀 What you can do with VideoScript:
              </h3>
              <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Fast Transcription:</strong> Convert videos to text in minutes</li>
                <li><strong>Multiple Formats:</strong> Support for YouTube, Vimeo, and direct video files</li>
                <li><strong>High Accuracy:</strong> AI-powered transcription with 95%+ accuracy</li>
                <li><strong>Easy Export:</strong> Download transcripts as text files or copy to clipboard</li>
                <li><strong>Real-time Dashboard:</strong> Track all your transcriptions in one place</li>
              </ul>
            </div>

            <!-- Free Trial Info -->
            <div style="background-color: #e8f5e8; border-left: 4px solid #27ae60; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #27ae60; font-size: 16px; margin: 0 0 10px 0;">
                🎁 Your Free Trial Includes:
              </h3>
              <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.5; text-align: justify;">
                <strong>3 free transcriptions per day</strong> to get you started! No credit card required. 
                Experience the full power of VideoScript before deciding to upgrade.
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://video-transcript.jcampos.dev'}/en" 
                 style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Start Your First Transcription
              </a>
            </div>

            <!-- Support Section -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 14px; margin: 0 0 10px 0;">
                Need help getting started? We're here to support you!
              </p>
              <p style="color: #555; font-size: 13px; margin: 0;">
                Check our documentation or contact our support team if you have any questions.
              </p>
            </div>

            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <div style="text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                VideoScript - Intelligent Video Transcription Service<br>
                Built with ❤️ for content creators and professionals
              </p>
            </div>
          </div>
        </div>
      `
    };
  }
}