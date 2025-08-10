import { Request, Response } from 'express';
import { ITranscriptionService } from '../services/transcription.service';
import { 
  createTranscriptionSchema, 
  updateTranscriptionSchema,
  TranscriptionStatus 
} from '../models/transcription.model';
import { AuthRequest } from '../types/auth.types';

export interface ITranscriptionController {
  createTranscription(req: AuthRequest, res: Response): Promise<void>;
  getTranscription(req: AuthRequest, res: Response): Promise<void>;
  getUserTranscriptions(req: AuthRequest, res: Response): Promise<void>;
  updateTranscription(req: AuthRequest, res: Response): Promise<void>;
  processWebhook(req: Request, res: Response): Promise<void>;
}

export class TranscriptionController implements ITranscriptionController {
  constructor(private transcriptionService: ITranscriptionService) {}

  async createTranscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const authenticatedUserId = req.userId;
      
      // Verify user can only create transcriptions for themselves
      if (userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only create transcriptions for your own account' });
        return;
      }

      console.log(`📝 Creating transcription for user: ${userId?.substring(0, 8)}...`);
      
      const { videoUrl } = req.body;
      
      // Validate input
      const validatedInput = createTranscriptionSchema.parse({
        userId: userId!,
        videoUrl
      });

      // Check if user can create transcription
      const canCreate = await this.transcriptionService.canUserCreateTranscription(userId!);
      if (!canCreate) {
        res.status(403).json({ 
          error: 'You have reached your transcription limit for your current plan' 
        });
        return;
      }

      // Create transcription
      const transcription = await this.transcriptionService.createTranscription(validatedInput);
      
      // Submit for processing
      await this.transcriptionService.submitForProcessing(transcription.id);
      
      console.log(`✅ Transcription created and submitted: ${transcription.id.substring(0, 8)}...`);
      
      res.status(201).json({
        id: transcription.id,
        videoUrl: transcription.videoUrl,
        videoTitle: transcription.videoTitle,
        status: transcription.status,
        createdAt: transcription.createdAt
      });
      
    } catch (error: any) {
      console.error('Error creating transcription:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to create transcription' });
    }
  }

  async getTranscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.params.userId;
      const authenticatedUserId = req.userId;
      
      const transcription = await this.transcriptionService.getTranscription(id);
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      // For domain-style routes (/users/{userId}/transcriptions/{id}), verify user access
      if (userId && userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only access your own transcriptions' });
        return;
      }

      // For transcription ownership verification
      if (transcription.userId && transcription.userId !== authenticatedUserId) {
        res.status(403).json({ error: 'Access denied to this transcription' });
        return;
      }

      res.json({
        id: transcription.id,
        videoUrl: transcription.videoUrl,
        videoTitle: transcription.videoTitle,
        status: transcription.status,
        transcript: transcription.transcript,
        duration: transcription.duration,
        wordCount: transcription.wordCount,
        processingTime: transcription.processingTime,
        accuracy: transcription.accuracy,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt
      });
      
    } catch (error: any) {
      console.error('Error getting transcription:', error);
      res.status(500).json({ error: error.message || 'Failed to get transcription' });
    }
  }

  async getUserTranscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const authenticatedUserId = req.userId;
      
      // Verify user can only access their own transcriptions
      if (userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only access your own transcriptions' });
        return;
      }

      console.log(`📝 Get user transcriptions: ${userId?.substring(0, 8)}...`);
      
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.transcriptionService.getUserTranscriptions(userId!, limit, offset);
      
      console.log(`✅ Retrieved ${result.transcriptions.length} transcriptions for user: ${userId?.substring(0, 8)}...`);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Error fetching user transcriptions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch transcriptions' });
    }
  }

  async updateTranscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.params.userId;
      const authenticatedUserId = req.userId;
      
      // Verify user can only update their own transcriptions
      if (userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only update your own transcriptions' });
        return;
      }

      const transcription = await this.transcriptionService.getTranscription(id);
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      // Verify transcription belongs to the user
      if (transcription.userId !== authenticatedUserId) {
        res.status(403).json({ error: 'Access denied to this transcription' });
        return;
      }

      console.log(`🔄 Updating transcription ${id.substring(0, 8)}... for user: ${userId?.substring(0, 8)}...`);
      
      const validatedInput = updateTranscriptionSchema.parse(req.body);
      const updatedTranscription = await this.transcriptionService.updateTranscription(id, validatedInput);
      
      if (!updatedTranscription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }
      
      console.log(`✅ Transcription updated: ${id.substring(0, 8)}...`);
      
      res.json({
        id: updatedTranscription.id,
        videoUrl: updatedTranscription.videoUrl,
        videoTitle: updatedTranscription.videoTitle,
        status: updatedTranscription.status,
        transcript: updatedTranscription.transcript,
        duration: updatedTranscription.duration,
        wordCount: updatedTranscription.wordCount,
        processingTime: updatedTranscription.processingTime,
        accuracy: updatedTranscription.accuracy,
        createdAt: updatedTranscription.createdAt,
        updatedAt: updatedTranscription.updatedAt
      });
      
    } catch (error: any) {
      console.error('Error updating transcription:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to update transcription' });
    }
  }

  async processWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = req.body;

      console.log(`📞 Processing webhook for transcription: ${id.substring(0, 8)}...`);
      
      // Validate webhook secret if configured
      const webhookSecret = process.env.TRANSCRIPTION_WEBHOOK_SECRET;
      if (webhookSecret) {
        const providedSecret = req.headers['x-webhook-secret'] as string;
        if (providedSecret !== webhookSecret) {
          console.log(`❌ Invalid webhook secret for transcription: ${id}`);
          res.status(401).json({ error: 'Invalid webhook secret' });
          return;
        }
      }

      const updatedTranscription = await this.transcriptionService.processWebhookResult(id, result);
      
      if (!updatedTranscription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }
      
      console.log(`✅ Webhook processed for transcription: ${id.substring(0, 8)}... - Status: ${updatedTranscription.status}`);
      
      res.json({
        success: true,
        transcriptionId: updatedTranscription.id,
        status: updatedTranscription.status
      });
      
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: error.message || 'Failed to process webhook' });
    }
  }
}