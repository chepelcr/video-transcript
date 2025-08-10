import AWS from 'aws-sdk';
import { APP_CONFIG } from '../config/app';

export interface TranscriptionRequest {
  transcriptionId: string;
  videoUrl: string;
  webhookUrl: string;
}

export interface ISQSService {
  sendTranscriptionRequest(request: TranscriptionRequest): Promise<void>;
}

export class SQSService implements ISQSService {
  private sqs: AWS.SQS;

  constructor() {
    // Configure AWS
    AWS.config.update({
      region: APP_CONFIG.AWS_REGION,
      accessKeyId: APP_CONFIG.AWS_ACCESS_KEY_ID,
      secretAccessKey: APP_CONFIG.AWS_SECRET_ACCESS_KEY
    });

    this.sqs = new AWS.SQS();
  }

  async sendTranscriptionRequest(request: TranscriptionRequest): Promise<void> {
    console.log(`📤 Sending SQS message for transcription: ${request.transcriptionId.substring(0, 8)}...`);
    
    if (!APP_CONFIG.SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL not configured');
    }

    const message = {
      transcriptionId: request.transcriptionId,
      videoUrl: request.videoUrl,
      webhookUrl: request.webhookUrl,
      timestamp: new Date().toISOString()
    };

    const params: AWS.SQS.SendMessageRequest = {
      QueueUrl: APP_CONFIG.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        TranscriptionId: {
          DataType: 'String',
          StringValue: request.transcriptionId
        },
        VideoUrl: {
          DataType: 'String',
          StringValue: request.videoUrl
        }
      }
    };

    try {
      const result = await this.sqs.sendMessage(params).promise();
      console.log(`✅ SQS message sent successfully: ${result.MessageId}`);
    } catch (error) {
      console.error(`❌ Failed to send SQS message:`, error);
      throw new Error(`Failed to send transcription request to queue: ${error.message}`);
    }
  }
}