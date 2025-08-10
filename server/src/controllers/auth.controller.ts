import { Request, Response } from 'express';
import { IAuthService } from '../services/auth.service';
import { IUserRepository } from '../repositories/user.repository';
import { registerSchema, loginSchema } from '../models/user.model';
import { AuthRequest } from '../types/auth.types';

export interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  me(req: AuthRequest, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
}

export class AuthController implements IAuthController {
  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log(`👤 Registration attempt: ${req.body.email}`);
      
      // Validate input
      const validatedInput = registerSchema.parse(req.body);
      
      // Register user
      const result = await this.authService.register(validatedInput);
      
      console.log(`✅ User registered: ${result.user.username} (${result.user.email})`);
      
      res.status(201).json(result);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          error: 'Invalid input data', 
          details: error.errors 
        });
        return;
      }
      
      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log(`🔐 Login attempt: ${req.body.email}`);
      
      // Validate input
      const validatedInput = loginSchema.parse(req.body);
      
      // Login user
      const result = await this.authService.login(validatedInput);
      
      console.log(`✅ User logged in: ${result.user.username} (${result.user.email})`);
      
      res.json(result);
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          error: 'Invalid input data', 
          details: error.errors 
        });
        return;
      }
      
      if (error.message.includes('Invalid email or password') || error.message.includes('Account is inactive')) {
        res.status(401).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await this.userRepository.findById(req.userId!);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(this.userRepository.toResponse(user));
      
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }
      
      const result = await this.authService.refreshAccessToken(refreshToken);
      
      console.log(`✅ Access token refreshed`);
      
      res.json(result);
      
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return a success response
      
      console.log(`👋 User logged out`);
      
      res.json({ message: 'Logged out successfully' });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}