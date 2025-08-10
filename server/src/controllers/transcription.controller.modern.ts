import { Request, Response, Router } from 'express';
import { ITranscriptionService } from '../services/transcription.service';
import { 
  createTranscriptionSchema, 
  updateTranscriptionSchema,
  TranscriptionStatus 
} from '../models/transcription.model';
import { AuthRequest } from '../types/auth.types';
import { IAuthMiddleware } from '../middlewares/auth.middleware';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

export interface ITranscriptionController {
  createTranscription(req: AuthRequest, res: Response): Promise<void>;
  getTranscriptionById(req: AuthRequest, res: Response): Promise<void>;
  getUserTranscriptions(req: AuthRequest, res: Response): Promise<void>;
  updateTranscription(req: AuthRequest, res: Response): Promise<void>;
  getPublicTranscription(req: Request, res: Response): Promise<void>;
  handleWebhook(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class TranscriptionController implements ITranscriptionController {
  private router: Router;

  constructor(
    private transcriptionService: ITranscriptionService,
    private authMiddleware: IAuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /users/{userId}/transcriptions:
     *   post:
     *     summary: Create User Transcription
     *     description: Submit video URL for transcription processing for specific user
     *     tags: [Transcriptions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: User UUID (must match authenticated user)
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - videoUrl
     *             properties:
     *               videoUrl:
     *                 type: string
     *                 format: url
     *                 description: Video URL (YouTube, Vimeo, or direct link)
     *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
     *               videoTitle:
     *                 type: string
     *                 description: Optional video title override
     *     responses:
     *       201:
     *         description: Transcription request created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Transcription'
     *       400:
     *         description: Invalid video URL or daily limit exceeded
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Not authenticated
     *       403:
     *         description: User can only access their own transcriptions
     */
    this.router.post(
      '/users/:userId/transcriptions',
      apiGatewayMiddleware,
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.createTranscription.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions:
     *   get:
     *     summary: Get User Transcriptions
     *     description: Get all transcriptions for specific user
     *     tags: [Transcriptions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: User UUID (must match authenticated user)
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 50
     *         description: Number of transcriptions to retrieve
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *         description: Number of transcriptions to skip
     *     responses:
     *       200:
     *         description: Transcriptions retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transcriptions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Transcription'
     *                 total:
     *                   type: integer
     *                   description: Total number of transcriptions
     *                 limit:
     *                   type: integer
     *                 offset:
     *                   type: integer
     *       401:
     *         description: Not authenticated
     *       403:
     *         description: User can only access their own transcriptions
     */
    this.router.get(
      '/users/:userId/transcriptions',
      apiGatewayMiddleware,
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.getUserTranscriptions.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions/{id}:
     *   get:
     *     summary: Get User Transcription By ID
     *     description: Get specific transcription by ID for specific user
     *     tags: [Transcriptions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: User UUID (must match authenticated user)
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: path
     *         name: id
     *         required: true
     *         description: Transcription UUID
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Transcription retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Transcription'
     *       401:
     *         description: Not authenticated
     *       403:
     *         description: User can only access their own transcriptions
     *       404:
     *         description: Transcription not found
     */
    this.router.get(
      '/users/:userId/transcriptions/:id',
      apiGatewayMiddleware,
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.getTranscriptionById.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions/{id}:
     *   patch:
     *     summary: Update User Transcription
     *     description: Update specific transcription for specific user
     *     tags: [Transcriptions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         description: User UUID (must match authenticated user)
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: path
     *         name: id
     *         required: true
     *         description: Transcription UUID
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               transcript:
     *                 type: string
     *                 description: Updated transcript text
     *               status:
     *                 type: string
     *                 enum: [pending, processing, completed, failed]
     *                 description: Updated transcription status
     *               duration:
     *                 type: number
     *                 description: Video duration in seconds
     *               wordCount:
     *                 type: number
     *                 description: Number of words in transcript
     *               accuracy:
     *                 type: number
     *                 minimum: 0
     *                 maximum: 100
     *                 description: Transcription accuracy percentage
     *     responses:
     *       200:
     *         description: Transcription updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Transcription'
     *       401:
     *         description: Not authenticated
     *       403:
     *         description: User can only access their own transcriptions
     *       404:
     *         description: Transcription not found
     */
    this.router.patch(
      '/users/:userId/transcriptions/:id',
      apiGatewayMiddleware,
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.updateTranscription.bind(this)
    );

    /**
     * @swagger
     * /transcriptions/{id}/public:
     *   get:
     *     summary: Get Public Transcription
     *     description: Get transcription for public viewing (no authentication required)
     *     tags: [Transcriptions]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Transcription UUID
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Public transcription retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Transcription'
     *       404:
     *         description: Transcription not found or not public
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get(
      '/transcriptions/:id/public',
      apiGatewayMiddleware,
      this.getPublicTranscription.bind(this)
    );

    /**
     * @swagger
     * /transcriptions/webhook/{id}:
     *   post:
     *     summary: Transcription Webhook
     *     description: Webhook endpoint for transcription processing updates
     *     tags: [Transcriptions]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Transcription UUID
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: header
     *         name: X-Webhook-Signature
     *         required: false
     *         description: Webhook signature for verification
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [pending, processing, completed, failed]
     *                 description: Updated transcription status
     *               transcript:
     *                 type: string
     *                 description: Transcription text (if completed)
     *               duration:
     *                 type: number
     *                 description: Video duration in seconds
     *               wordCount:
     *                 type: number
     *                 description: Number of words in transcript
     *               accuracy:
     *                 type: number
     *                 minimum: 0
     *                 maximum: 100
     *                 description: Transcription accuracy percentage
     *               processingTime:
     *                 type: number
     *                 description: Processing time in seconds
     *               error:
     *                 type: string
     *                 description: Error message (if status is failed)
     *     responses:
     *       200:
     *         description: Webhook processed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *       400:
     *         description: Invalid webhook payload
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Transcription not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post(
      '/transcriptions/webhook/:id',
      apiGatewayMiddleware,
      this.handleWebhook.bind(this)
    );
  }

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

  async getTranscriptionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, id } = req.params;
      const authenticatedUserId = req.userId;

      // Verify user can only access their own transcriptions
      if (userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only access your own transcriptions' });
        return;
      }

      console.log(`📝 Getting transcription ${id?.substring(0, 8)}... for user: ${userId?.substring(0, 8)}...`);
      
      const transcription = await this.transcriptionService.getTranscriptionById(id!, userId!);
      
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }
      
      res.json(transcription);
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

      const result = await this.transcriptionService.getUserTranscriptions(userId!, {
        limit: Math.min(limit, 100), // Cap at 100
        offset: Math.max(offset, 0) // Ensure non-negative
      });

      const total = await this.transcriptionService.getUserTranscriptionCount(userId!);
      
      console.log(`✅ Retrieved ${result.length} transcriptions for user: ${userId?.substring(0, 8)}...`);
      
      res.json({
        transcriptions: result,
        total,
        limit,
        offset
      });
      
    } catch (error: any) {
      console.error('Error getting user transcriptions:', error);
      res.status(500).json({ error: error.message || 'Failed to get transcriptions' });
    }
  }

  async updateTranscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, id } = req.params;
      const authenticatedUserId = req.userId;

      // Verify user can only update their own transcriptions
      if (userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only update your own transcriptions' });
        return;
      }

      console.log(`📝 Updating transcription ${id?.substring(0, 8)}... for user: ${userId?.substring(0, 8)}...`);

      // Validate input
      const validatedInput = updateTranscriptionSchema.parse(req.body);

      const transcription = await this.transcriptionService.updateTranscription(id!, userId!, validatedInput);
      
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      console.log(`✅ Transcription updated: ${transcription.id.substring(0, 8)}...`);
      
      res.json(transcription);
      
    } catch (error: any) {
      console.error('Error updating transcription:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to update transcription' });
    }
  }

  async getPublicTranscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      console.log(`🌍 Getting public transcription: ${id?.substring(0, 8)}...`);
      
      const transcription = await this.transcriptionService.getPublicTranscription(id!);
      
      if (!transcription) {
        res.status(404).json({ error: 'Transcription not found or not available for public access' });
        return;
      }
      
      // Only return public-safe information
      res.json({
        id: transcription.id,
        videoUrl: transcription.videoUrl,
        videoTitle: transcription.videoTitle,
        transcript: transcription.transcript,
        status: transcription.status,
        duration: transcription.duration,
        wordCount: transcription.wordCount,
        accuracy: transcription.accuracy,
        createdAt: transcription.createdAt
      });
      
    } catch (error: any) {
      console.error('Error getting public transcription:', error);
      res.status(500).json({ error: error.message || 'Failed to get transcription' });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      console.log(`📬 Processing webhook for transcription: ${id?.substring(0, 8)}...`);
      
      // Validate input
      const validatedInput = updateTranscriptionSchema.parse(req.body);

      const result = await this.transcriptionService.processWebhookUpdate(id!, validatedInput);
      
      if (!result) {
        res.status(404).json({ error: 'Transcription not found' });
        return;
      }

      console.log(`✅ Webhook processed for transcription: ${id?.substring(0, 8)}...`);
      
      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
      
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid webhook payload', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to process webhook' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}