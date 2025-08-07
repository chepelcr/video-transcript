import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import crypto from "crypto";

export interface TranscriptionQueueMessage {
  transcriptionId: string;
  videoUrl: string;
  userId: string;
  webhookUrl: string;
}

export class SQSService {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private webhookSecret: string;

  constructor() {
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is required');
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is required');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY environment variable is required');
    }
    if (!process.env.SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL environment variable is required');
    }
    if (!process.env.TRANSCRIPTION_WEBHOOK_SECRET) {
      throw new Error('TRANSCRIPTION_WEBHOOK_SECRET environment variable is required');
    }

    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.queueUrl = process.env.SQS_QUEUE_URL;
    this.webhookSecret = process.env.TRANSCRIPTION_WEBHOOK_SECRET;
  }

  async queueTranscription(transcriptionId: string, videoUrl: string, userId: string): Promise<void> {
    try {
      // Create webhook URL for this transcription
      const baseUrl = process.env.API_BASE_URL || 'https://video-transcript-api.onrender.com';
      const webhookUrl = `${baseUrl}/api/transcriptions/webhook/${transcriptionId}`;

      const message: TranscriptionQueueMessage = {
        transcriptionId,
        videoUrl,
        userId,
        webhookUrl,
      };

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          transcriptionId: {
            DataType: 'String',
            StringValue: transcriptionId,
          },
          userId: {
            DataType: 'String',
            StringValue: userId,
          },
        },
      });

      const result = await this.sqsClient.send(command);
      console.log('Transcription queued successfully:', {
        transcriptionId,
        messageId: result.MessageId,
      });

    } catch (error) {
      console.error('Error queuing transcription:', error);
      throw new Error('Failed to queue transcription for processing');
    }
  }

  generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = this.generateWebhookSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const sqsService = new SQSService();