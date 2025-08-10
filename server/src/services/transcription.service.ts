import { ITranscriptionRepository } from '../repositories/transcription.repository';
import { IUserRepository } from '../repositories/user.repository';
import { 
  ITranscription, 
  CreateTranscriptionInput, 
  UpdateTranscriptionInput,
  TranscriptionStatus
} from '../models/transcription.model';
import { SQSService } from './sqs.service';
import { VideoTitleService } from './video-title.service';

export interface ITranscriptionService {
  createTranscription(input: CreateTranscriptionInput): Promise<ITranscription>;
  createAnonymousTranscription(input: CreateTranscriptionInput): Promise<ITranscription>;
  getTranscription(id: string): Promise<ITranscription | null>;
  getUserTranscriptions(userId: string, limit?: number, offset?: number): Promise<{
    transcriptions: ITranscription[];
    total: number;
  }>;
  updateTranscription(id: string, input: UpdateTranscriptionInput): Promise<ITranscription | null>;
  submitForProcessing(transcriptionId: string): Promise<void>;
  processWebhookResult(transcriptionId: string, result: any): Promise<ITranscription | null>;
  canUserCreateTranscription(userId: string): Promise<boolean>;
}

export class TranscriptionService implements ITranscriptionService {
  constructor(
    private transcriptionRepository: ITranscriptionRepository,
    private userRepository: IUserRepository,
    private sqsService: SQSService,
    private videoTitleService: VideoTitleService
  ) {}

  async createTranscription(input: CreateTranscriptionInput): Promise<ITranscription> {
    console.log(`🎬 Creating transcription for video: ${input.videoUrl}`);
    
    // Check if user can create transcription (free tier limits)
    const canCreate = await this.canUserCreateTranscription(input.userId);
    if (!canCreate) {
      throw new Error('User has reached their transcription limit for the current tier');
    }

    // Extract video title if not provided
    let videoTitle = input.videoTitle;
    if (!videoTitle) {
      try {
        videoTitle = await this.videoTitleService.extractTitle(input.videoUrl);
        console.log(`✅ Extracted video title: "${videoTitle}"`);
      } catch (error) {
        console.log(`⚠️ Failed to extract video title, using fallback`);
        videoTitle = 'Unknown Video';
      }
    }

    // Create transcription
    const transcription = await this.transcriptionRepository.create({
      ...input,
      videoTitle,
      status: TranscriptionStatus.PENDING
    });

    console.log(`✅ Transcription created: ${transcription.id.substring(0, 8)}... - ${videoTitle}`);
    return transcription;
  }

  // Lambda-style: Create transcription without user authentication
  async createAnonymousTranscription(input: CreateTranscriptionInput): Promise<ITranscription> {
    console.log(`🚀 Creating anonymous transcription for video: ${input.videoUrl}`);
    
    // Extract video title if not provided
    let videoTitle = input.videoTitle;
    if (!videoTitle) {
      try {
        videoTitle = await this.videoTitleService.extractTitle(input.videoUrl);
        console.log(`✅ Extracted video title: "${videoTitle}"`);
      } catch (error) {
        console.log(`⚠️ Failed to extract video title, using fallback`);
        videoTitle = 'Unknown Video';
      }
    }

    // Create anonymous transcription (no user limits applied)
    const transcription = await this.transcriptionRepository.create({
      ...input,
      userId: null, // Anonymous transcription
      videoTitle,
      status: TranscriptionStatus.PENDING
    });

    console.log(`✅ Anonymous transcription created: ${transcription.id.substring(0, 8)}... - ${videoTitle}`);
    return transcription;
  }

  async getTranscription(id: string): Promise<ITranscription | null> {
    return this.transcriptionRepository.findById(id);
  }

  async getUserTranscriptions(userId: string, limit = 50, offset = 0): Promise<{
    transcriptions: ITranscription[];
    total: number;
  }> {
    return this.transcriptionRepository.findByUserId(userId, limit, offset);
  }

  async updateTranscription(id: string, input: UpdateTranscriptionInput): Promise<ITranscription | null> {
    console.log(`🔄 Updating transcription ${id.substring(0, 8)}... with status: ${input.status}`);
    
    const updated = await this.transcriptionRepository.update(id, input);
    
    if (updated && input.status === TranscriptionStatus.COMPLETED) {
      // Increment user's transcription count
      await this.userRepository.incrementTranscriptionsUsed(updated.userId);
      console.log(`✅ Incremented transcription count for user: ${updated.userId.substring(0, 8)}...`);
    }
    
    return updated;
  }

  async submitForProcessing(transcriptionId: string): Promise<void> {
    console.log(`🚀 Submitting transcription for processing: ${transcriptionId.substring(0, 8)}...`);
    
    // Get transcription
    const transcription = await this.transcriptionRepository.findById(transcriptionId);
    if (!transcription) {
      throw new Error('Transcription not found');
    }

    // Update status to processing
    await this.transcriptionRepository.update(transcriptionId, {
      status: TranscriptionStatus.PROCESSING
    });

    // Submit to SQS queue
    try {
      await this.sqsService.sendTranscriptionRequest({
        transcriptionId: transcription.id,
        videoUrl: transcription.videoUrl,
        webhookUrl: `${process.env.API_BASE_URL}/api/transcriptions/webhook/${transcription.id}`
      });
      
      console.log(`✅ Transcription submitted to SQS: ${transcriptionId.substring(0, 8)}...`);
    } catch (error) {
      console.error(`❌ Failed to submit to SQS: ${error}`);
      
      // Update status to failed
      await this.transcriptionRepository.update(transcriptionId, {
        status: TranscriptionStatus.FAILED
      });
      
      throw error;
    }
  }

  async processWebhookResult(transcriptionId: string, result: any): Promise<ITranscription | null> {
    console.log(`📞 Processing webhook result for: ${transcriptionId.substring(0, 8)}...`);
    
    const transcription = await this.transcriptionRepository.findById(transcriptionId);
    if (!transcription) {
      console.log(`❌ Transcription not found for webhook: ${transcriptionId}`);
      return null;
    }

    if (result.success) {
      // Update with successful results
      const updated = await this.updateTranscription(transcriptionId, {
        transcript: result.transcript || "",
        duration: result.duration || 0,
        wordCount: result.wordCount || 0,
        processingTime: result.processingTime || 0,
        accuracy: result.accuracy || 0,
        status: TranscriptionStatus.COMPLETED
      });
      
      console.log(`✅ Transcription completed successfully: ${transcriptionId.substring(0, 8)}...`);
      return updated;
    } else {
      // Update as failed
      const updated = await this.updateTranscription(transcriptionId, {
        status: TranscriptionStatus.FAILED
      });
      
      console.log(`❌ Transcription failed: ${transcriptionId.substring(0, 8)}... - ${result.error}`);
      return updated;
    }
  }

  async canUserCreateTranscription(userId: string): Promise<boolean> {
    console.log(`🔍 Checking transcription limits for user: ${userId.substring(0, 8)}...`);
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      return false;
    }

    // Check subscription tier limits
    const limits = {
      free: 3,
      pro: 100,
      enterprise: -1 // unlimited
    };

    const limit = limits[user.subscriptionTier];
    if (limit === -1) {
      console.log(`✅ User has unlimited transcriptions (enterprise)`);
      return true;
    }

    const canCreate = user.transcriptionsUsed < limit;
    console.log(`${canCreate ? '✅' : '❌'} User transcription check: ${user.transcriptionsUsed}/${limit} used`);
    
    return canCreate;
  }
}