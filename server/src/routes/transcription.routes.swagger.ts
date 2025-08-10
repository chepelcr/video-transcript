import { Router } from 'express';
import { ITranscriptionController } from '../controllers/transcription.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

export class TranscriptionRoutesSwagger {
  private router: Router;

  constructor(
    private transcriptionController: ITranscriptionController,
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
      this.transcriptionController.createTranscription.bind(this.transcriptionController)
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
      this.transcriptionController.getUserTranscriptions.bind(this.transcriptionController)
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
      this.transcriptionController.getTranscriptionById.bind(this.transcriptionController)
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
      this.transcriptionController.updateTranscription.bind(this.transcriptionController)
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
      this.transcriptionController.getPublicTranscription.bind(this.transcriptionController)
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
      this.transcriptionController.handleWebhook.bind(this.transcriptionController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}