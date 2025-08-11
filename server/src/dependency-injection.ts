// Dependency Injection Container
// This file creates all the dependencies following the industry standard architecture

import { TranscriptionRepository } from './repositories/transcription.repository';
import { UserRepository } from './repositories/user.repository';
import { TranscriptionService } from './services/transcription.service';
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { SQSService } from './services/sqs.service';
import { VideoTitleService } from './services/video-title.service';
import { NotificationService } from './services/notification.service';
// Removed AuthMiddleware import - authentication now handled by AWS API Gateway
// Modern controllers with embedded routing (AWS API Gateway compatible)
import { TranscriptionController as ModernTranscriptionController } from './controllers/transcription.controller.modern';

import { UserController as ModernUserController } from './controllers/user.controller.modern';
import { PaymentController as ModernPaymentController } from './controllers/payment.controller.modern';
import { HealthController as ModernHealthController } from './controllers/health.controller.modern';
import { NotificationController } from './controllers/notification.controller';

// Create repositories
export const transcriptionRepository = new TranscriptionRepository();
export const userRepository = new UserRepository();

// Create services
export const sqsService = new SQSService();
export const videoTitleService = new VideoTitleService();
export const emailService = new EmailService();
export const notificationService = new NotificationService();
export const authService = new AuthService(userRepository, emailService);
export const transcriptionService = new TranscriptionService(
  transcriptionRepository,
  userRepository,
  sqsService,
  videoTitleService
);

// Middlewares removed - authentication now handled by AWS API Gateway

// Modern controllers with embedded routes (AWS API Gateway compatible)
export const modernTranscriptionController = new ModernTranscriptionController(transcriptionService);

export const modernUserController = new ModernUserController(userRepository);
export const modernPaymentController = new ModernPaymentController(userRepository);
export const modernHealthController = new ModernHealthController();
export const notificationController = new NotificationController(notificationService);

// Legacy routes removed - all functionality migrated to modern controllers