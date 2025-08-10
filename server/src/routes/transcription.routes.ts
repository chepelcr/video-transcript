import { Router } from 'express';
import { ITranscriptionController } from '../controllers/transcription.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';
import { apiGatewayMiddleware, apiGatewayAuthBypass } from '../middlewares/api-gateway.middleware';

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

    // Lambda-style endpoints - API Gateway auth bypass + anonymous transcription
    this.router.post('/anonymous', 
      apiGatewayAuthBypass,
      (req, res) => this.transcriptionController.createAnonymousTranscription(req, res)
    );

    // Public endpoint to get transcription by ID (lambda-style)
    this.router.get('/:id/public',
      (req, res, next) => this.authMiddleware.optionalAuthenticate(req, res, next),
      (req, res) => this.transcriptionController.getTranscription(req, res)
    );

    // Protected routes - require authentication
    this.router.post('/',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.createTranscription(req, res)
    );

    this.router.get('/',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.getUserTranscriptions(req, res)
    );

    this.router.get('/:id',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.getTranscription(req, res)
    );

    this.router.patch('/:id',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.transcriptionController.updateTranscription(req, res)
    );

    // Webhook endpoint - public (no auth required)
    this.router.post('/webhook/:id', (req, res) => 
      this.transcriptionController.processWebhook(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}