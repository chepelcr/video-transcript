// Dependency Injection Container
// This file creates all the dependencies following the industry standard architecture

import { TranscriptionRepository } from './repositories/transcription.repository';
import { UserRepository } from './repositories/user.repository';
import { TranscriptionService } from './services/transcription.service';
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { SQSService } from './services/sqs.service';
import { VideoTitleService } from './services/video-title.service';
import { TranscriptionController } from './controllers/transcription.controller';
import { AuthController } from './controllers/auth.controller';
import { PaymentController } from './controllers/payment.controller';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
// Modern controllers include routing
import { TranscriptionController as ModernTranscriptionController } from './controllers/transcription.controller.modern';

// Create repositories
export const transcriptionRepository = new TranscriptionRepository();
export const userRepository = new UserRepository();

// Create services
export const sqsService = new SQSService();
export const videoTitleService = new VideoTitleService();
export const emailService = new EmailService();
export const authService = new AuthService(userRepository, emailService);
export const transcriptionService = new TranscriptionService(
  transcriptionRepository,
  userRepository,
  sqsService,
  videoTitleService
);

// Create controllers (legacy for now)
export const authController = new AuthController(authService, userRepository);
export const transcriptionController = new TranscriptionController(transcriptionService);
export const paymentController = new PaymentController(userRepository);
export const userController = new UserController(userRepository, transcriptionRepository);
export const healthController = new HealthController();

// Create middlewares
export const authMiddleware = new AuthMiddleware(authService);

// Modern controller with embedded routes
export const modernTranscriptionController = new ModernTranscriptionController(transcriptionService, authMiddleware);

// Legacy route exports (for backwards compatibility - will be removed)
import { TranscriptionRoutes } from './routes/transcription.routes';
import { AuthRoutes } from './routes/auth.routes';
import { PaymentRoutes } from './routes/payment.routes';
import { UserRoutes } from './routes/user.routes';
import { HealthRoutes } from './routes/health.routes';

export const authRoutes = new AuthRoutes(authController, authMiddleware);
export const transcriptionRoutes = new TranscriptionRoutes(transcriptionController, authMiddleware);
export const paymentRoutes = new PaymentRoutes(paymentController, authMiddleware);
export const userRoutes = new UserRoutes(userController, authMiddleware);
export const healthRoutes = new HealthRoutes(healthController);