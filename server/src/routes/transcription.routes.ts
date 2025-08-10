import { Router } from 'express';
import { ITranscriptionController } from '../controllers/transcription.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

export class TranscriptionRoutes {
  private router: Router;

  constructor(
    private transcriptionController: ITranscriptionController,
    private authMiddleware: IAuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Apply API Gateway middleware to all routes
    this.router.use(apiGatewayMiddleware);

    // Domain-style routes: /users/{userId}/transcriptions
    this.router.post('/users/:userId/transcriptions',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.createTranscription(req, res)
    );

    this.router.get('/users/:userId/transcriptions',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.getUserTranscriptions(req, res)
    );

    this.router.get('/users/:userId/transcriptions/:id',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.getTranscription(req, res)
    );

    this.router.patch('/users/:userId/transcriptions/:id',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.updateTranscription(req, res)
    );

    // Public transcription access (no userId required)
    this.router.get('/transcriptions/:id/public',
      (req, res, next) => this.authMiddleware.optionalAuthenticate(req, res, next),
      (req, res) => this.transcriptionController.getTranscription(req, res)
    );

    // Webhook endpoint - public (no auth required)
    this.router.post('/transcriptions/webhook/:id', (req, res) => 
      this.transcriptionController.processWebhook(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}