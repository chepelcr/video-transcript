import jwt from 'jsonwebtoken';
import { IUserRepository } from '../repositories/user.repository';
import { 
  IUser, 
  CreateUserInput, 
  LoginInput, 
  RegisterInput,
  UserResponse
} from '../models/user.model';
import { APP_CONFIG } from '../config/app';

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
}

export class AuthService implements IAuthService {
  constructor(private userRepository: IUserRepository) {}

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
}