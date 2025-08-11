import { Request, Response, Router } from 'express';
import { ITranscriptionService } from '../services/transcription.service';
import { 
  createTranscriptionSchema, 
  updateTranscriptionSchema,
  TranscriptionStatus 
} from '../models/transcription.model';
// Removed apiGatewayMiddleware import - authentication now handled by AWS API Gateway

export interface ITranscriptionController {
  createTranscription(req: Request, res: Response): Promise<void>;
  getTranscriptionById(req: Request, res: Response): Promise<void>;
  getUserTranscriptions(req: Request, res: Response): Promise<void>;
  updateTranscription(req: Request, res: Response): Promise<void>;
  getPublicTranscription(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class TranscriptionController implements ITranscriptionController {
  private router: Router;

  constructor(
    private transcriptionService: ITranscriptionService
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
     *     description: Submit video URL for transcription processing for specific user. Authentication handled by AWS API Gateway.
     *     tags: [Transcriptions]
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
      this.createTranscription.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions:
     *   get:
     *     summary: Get User Transcriptions
     *     description: Get all transcriptions for specific user. Authentication handled by AWS API Gateway.
     *     tags: [Transcriptions]
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
      this.getUserTranscriptions.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions/{id}:
     *   get:
     *     summary: Get User Transcription By ID
     *     description: Get specific transcription by ID for specific user. Authentication handled by AWS API Gateway.
     *     tags: [Transcriptions]
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
      this.getTranscriptionById.bind(this)
    );

    /**
     * @swagger
     * /users/{userId}/transcriptions/{id}:
     *   patch:
     *     summary: Update User Transcription
     *     description: Update specific transcription for specific user. Authentication handled by AWS API Gateway.
     *     tags: [Transcriptions]
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
      this.getPublicTranscription.bind(this)
    );

    /**
     * @swagger
     * /transcriptions/create:
     *   post:
     *     summary: Create Transcription (Generic)
     *     description: Submit video URL for transcription processing. User ID extracted from AWS API Gateway context.
     *     tags: [Transcriptions]
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
     *       401:
     *         description: Not authenticated
     */
    this.router.post(
      '/transcriptions/create',
      this.createTranscriptionGeneric.bind(this)
    );
  }

  async createTranscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      // AWS API Gateway handles authorization - user ID comes from validated context
      console.log(`📝 Creating transcription for user: ${userId?.substring(0, 8)}... (AWS API Gateway authorized)`);
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
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

  async getTranscriptionById(req: Request, res: Response): Promise<void> {
    try {
      const { userId, id } = req.params;

      // AWS API Gateway handles authorization

      console.log(`📝 Getting transcription ${id?.substring(0, 8)}... for user: ${userId?.substring(0, 8)}...`);
      
      const transcription = await this.transcriptionService.getTranscription(id!);
      
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

  async getUserTranscriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      // AWS API Gateway handles authorization

      console.log(`📝 Get user transcriptions: ${userId?.substring(0, 8)}...`);

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await this.transcriptionService.getUserTranscriptions(userId!, Math.min(limit, 100), Math.max(offset, 0));
      
      console.log(`✅ Retrieved transcription result:`, result);
      
      if (!result || !result.transcriptions) {
        console.log(`❌ Invalid result structure from service`);
        res.json({
          transcriptions: [],
          total: 0
        });
        return;
      }
      
      console.log(`✅ Retrieved ${result.transcriptions.length} transcriptions for user: ${userId?.substring(0, 8)}...`);
      
      res.json({
        transcriptions: result.transcriptions,
        total: result.total
      });
      
    } catch (error: any) {
      console.error('Error getting user transcriptions:', error);
      res.status(500).json({ error: error.message || 'Failed to get transcriptions' });
    }
  }

  async updateTranscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId, id } = req.params;

      // AWS API Gateway handles authorization

      console.log(`📝 Updating transcription ${id?.substring(0, 8)}... for user: ${userId?.substring(0, 8)}...`);

      // Validate input
      const validatedInput = updateTranscriptionSchema.parse(req.body);

      const transcription = await this.transcriptionService.updateTranscription(id!, validatedInput);
      
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
      
      const transcription = await this.transcriptionService.getTranscription(id!);
      
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

  public getRouter(): Router {
    return this.router;
  }
}