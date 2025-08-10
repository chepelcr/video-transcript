import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../repositories/user.repository';
import { 
  IUser, 
  CreateUserInput, 
  LoginInput, 
  RegisterInput,
  UserResponse
} from '../models/user.model';
import { APP_CONFIG } from '../config/app';
import { IEmailService } from './email.service';

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  verifyToken(token: string): Promise<IUser | null>;
  generateTokens(user: IUser): { accessToken: string; refreshToken: string };
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
  sendVerificationEmail(email: string): Promise<boolean>;
  verifyEmail(email: string, code: string): Promise<boolean>;
  sendPasswordResetEmail(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
}

export class AuthService implements IAuthService {
  private verificationCodes: Map<string, { code: string; expires: Date }> = new Map();
  private resetTokens: Map<string, { userId: string; expires: Date }> = new Map();

  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    console.log(`👤 Registering new user: ${input.email}`);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new Error('Username is already taken');
    }

    // Create user
    const user = await this.userRepository.create(input);
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    console.log(`✅ User registered successfully: ${user.username} (${user.email})`);
    
    return {
      user: this.userRepository.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    console.log(`🔐 User login attempt: ${input.email}`);
    
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      console.log(`❌ Login failed - user not found: ${input.email}`);
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.userRepository.verifyPassword(user, input.password);
    if (!isPasswordValid) {
      console.log(`❌ Login failed - invalid password: ${input.email}`);
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Login failed - user account is inactive: ${input.email}`);
      throw new Error('Account is inactive');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);
    
    console.log(`✅ User logged in successfully: ${user.username} (${user.email})`);
    
    return {
      user: this.userRepository.toResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async verifyToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(token, APP_CONFIG.JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'access') {
        return null;
      }

      const user = await this.userRepository.findById(decoded.userId);
      return user;
    } catch (error) {
      console.log(`❌ Token verification failed: ${error.message}`);
      return null;
    }
  }

  generateTokens(user: IUser): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { userId: user.id, type: 'access' },
      APP_CONFIG.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      APP_CONFIG.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, APP_CONFIG.JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      const accessToken = jwt.sign(
        { userId: user.id, type: 'access' },
        APP_CONFIG.JWT_SECRET,
        { expiresIn: '2h' }
      );

      return { accessToken };
    } catch (error) {
      console.log(`❌ Refresh token failed: ${error.message}`);
      throw new Error('Invalid refresh token');
    }
  }

  async sendVerificationEmail(email: string): Promise<boolean> {
    try {
      console.log(`📧 Preparing verification email for: ${email}`);
      
      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Store verification code
      this.verificationCodes.set(email, { code: verificationCode, expires });
      
      // Send email
      const sent = await this.emailService.sendVerificationEmail(email, verificationCode);
      
      if (!sent) {
        console.error(`❌ Failed to send verification email to: ${email}`);
        return false;
      }
      
      console.log(`✅ Verification email sent to: ${email}`);
      return true;
      
    } catch (error) {
      console.error('Send verification email error:', error);
      return false;
    }
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    try {
      console.log(`📧 Verifying email: ${email} with code: ${code}`);
      
      const storedData = this.verificationCodes.get(email);
      
      if (!storedData) {
        console.log(`❌ No verification code found for: ${email}`);
        return false;
      }
      
      if (new Date() > storedData.expires) {
        console.log(`❌ Verification code expired for: ${email}`);
        this.verificationCodes.delete(email);
        return false;
      }
      
      if (storedData.code !== code.toUpperCase()) {
        console.log(`❌ Invalid verification code for: ${email}`);
        return false;
      }
      
      // Update user verification status
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        await this.userRepository.update(user.id, { emailVerified: true });
      }
      
      // Clean up
      this.verificationCodes.delete(email);
      
      console.log(`✅ Email verified successfully: ${email}`);
      return true;
      
    } catch (error) {
      console.error('Verify email error:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<boolean> {
    try {
      console.log(`🔑 Preparing password reset email for: ${email}`);
      
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        console.log(`❌ User not found for password reset: ${email}`);
        // For security, we still return true to avoid user enumeration
        return true;
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      this.resetTokens.set(resetToken, { userId: user.id, expires });
      
      // Send email
      const sent = await this.emailService.sendPasswordResetEmail(email, resetToken);
      
      if (!sent) {
        console.error(`❌ Failed to send password reset email to: ${email}`);
        return false;
      }
      
      console.log(`✅ Password reset email sent to: ${email}`);
      return true;
      
    } catch (error) {
      console.error('Send password reset email error:', error);
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      console.log(`🔐 Processing password reset with token: ${token.substring(0, 8)}...`);
      
      const storedData = this.resetTokens.get(token);
      
      if (!storedData) {
        console.log(`❌ Invalid reset token: ${token.substring(0, 8)}...`);
        return false;
      }
      
      if (new Date() > storedData.expires) {
        console.log(`❌ Reset token expired: ${token.substring(0, 8)}...`);
        this.resetTokens.delete(token);
        return false;
      }
      
      // Update user password
      const user = await this.userRepository.findById(storedData.userId);
      
      if (!user) {
        console.log(`❌ User not found for password reset: ${storedData.userId.substring(0, 8)}...`);
        return false;
      }
      
      await this.userRepository.update(user.id, { password: newPassword });
      
      // Clean up
      this.resetTokens.delete(token);
      
      console.log(`✅ Password reset successfully for user: ${user.email}`);
      return true;
      
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }
}