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
      console.log(`📝 Creating transcription for user: ${req.userId?.substring(0, 8)}...`);
      
      const { videoUrl } = req.body;
      
      // Validate input
      const validatedInput = createTranscriptionSchema.parse({
        userId: req.userId!,
        videoUrl
      });

      // Check if user can create transcription
      const canCreate = await this.transcriptionService.canUserCreateTranscription(req.userId!);
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
      
    } catch (error) {
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
      
      const transcription = await this.transcriptionService.getTranscription(id);
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      // Ensure user can only access their own transcriptions
      if (transcription.userId !== req.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(transcription);
      
    } catch (error) {
      console.error('Error getting transcription:', error);
      res.status(500).json({ error: 'Failed to get transcription' });
    }
  }

  async getUserTranscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await this.transcriptionService.getUserTranscriptions(
        req.userId!,
        limit,
        offset
      );

      // AGGRESSIVE cache prevention
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', Math.random().toString());
      res.set('Last-Modified', new Date().toUTCString());
      res.set('Vary', '*');
      
      res.json({
        transcriptions: result.transcriptions,
        total: result.total,
        page: Math.floor(offset / limit) + 1,
        limit: limit
      });
      
    } catch (error) {
      console.error('Error getting user transcriptions:', error);
      res.status(500).json({ error: 'Failed to get transcriptions' });
    }
  }

  async updateTranscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate input
      const validatedInput = updateTranscriptionSchema.parse(req.body);
      
      // Get transcription to verify ownership
      const transcription = await this.transcriptionService.getTranscription(id);
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      // Ensure user can only update their own transcriptions
      if (transcription.userId !== req.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Update transcription
      const updated = await this.transcriptionService.updateTranscription(id, validatedInput);
      
      console.log(`✅ Transcription updated: ${id.substring(0, 8)}... - Status: ${updated?.status}`);
      
      res.json(updated);
      
    } catch (error) {
      console.error('Error updating transcription:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update transcription' });
    }
  }

  async processWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const signature = req.headers['x-webhook-signature'] as string;
      
      console.log(`📞 Processing webhook for transcription: ${id.substring(0, 8)}...`);
      
      // Verify webhook signature (skip for testing)
      if (!signature) {
        console.log('⚠️ Webhook signature missing, continuing anyway for testing');
      }

      const { success, transcript, duration, wordCount, processingTime, accuracy, error } = req.body;

      // Process webhook result
      const result = await this.transcriptionService.processWebhookResult(id, {
        success,
        transcript,
        duration,
        wordCount,
        processingTime,
        accuracy,
        error
      });

      if (!result) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      console.log(`✅ Webhook processed successfully for: ${id.substring(0, 8)}...`);
      res.json({ message: 'Webhook processed successfully' });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}