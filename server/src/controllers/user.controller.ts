import { Response } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { ITranscriptionRepository } from '../repositories/transcription.repository';
import { AuthRequest } from '../types/auth.types';

export interface IUserController {
  getUserProfile(req: AuthRequest, res: Response): Promise<void>;
  updateUserProfile(req: AuthRequest, res: Response): Promise<void>;
  getUserTranscriptions(req: AuthRequest, res: Response): Promise<void>;
}

export class UserController implements IUserController {
  constructor(
    private userRepository: IUserRepository,
    private transcriptionRepository: ITranscriptionRepository
  ) {}

  async getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`👤 Get user profile: ${req.userId?.substring(0, 8)}...`);
      
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

  async updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`👤 Update user profile: ${req.userId?.substring(0, 8)}...`);
      
      const { firstName, lastName } = req.body;
      
      if (!firstName && !lastName) {
        res.status(400).json({ error: 'At least one field (firstName or lastName) is required' });
        return;
      }

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      const user = await this.userRepository.update(req.userId!, updateData);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      console.log(`✅ User profile updated: ${user.username} (${user.email})`);
      
      res.json(this.userRepository.toResponse(user));
      
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  }

  async getUserTranscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📝 Get user transcriptions: ${req.userId?.substring(0, 8)}...`);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const result = await this.transcriptionRepository.findByUserId(req.userId!, limit, offset);
      const total = await this.transcriptionRepository.countByUserId(req.userId!);

      const response = {
        transcriptions: result,
        total,
        page,
        limit,
      };

      console.log(`✅ Retrieved ${result.length} transcriptions for user: ${req.userId?.substring(0, 8)}...`);

      res.json(response);
      
    } catch (error) {
      console.error('Get user transcriptions error:', error);
      res.status(500).json({ error: 'Failed to get user transcriptions' });
    }
  }
}