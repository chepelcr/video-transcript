import { Request, Response, Router } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { ITranscriptionRepository } from '../repositories/transcription.repository';
import { UpdateUserInput } from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

export interface IUserController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  getTranscriptions(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class UserController implements IUserController {
  private router: Router;

  constructor(
    private userRepository: IUserRepository,
    private transcriptionRepository: ITranscriptionRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/users/profile:
     *   get:
     *     summary: Get User Profile
     *     description: Get detailed user profile information
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: User profile retrieved
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/profile', apiGatewayMiddleware, this.getProfile.bind(this));

    /**
     * @swagger
     * /api/users/profile:
     *   put:
     *     summary: Update User Profile
     *     description: Update user profile information (username only)
     *     tags: [Users]
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 description: New username
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Username already taken
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.put('/profile', apiGatewayMiddleware, this.updateProfile.bind(this));

    /**
     * @swagger
     * /api/users/transcriptions:
     *   get:
     *     summary: Get User Transcriptions (Legacy)
     *     description: Get all transcriptions for authenticated user (legacy endpoint, use /users/{userId}/transcriptions instead)
     *     tags: [Users]
     *     deprecated: true
     *     responses:
     *       200:
     *         description: User transcriptions retrieved
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
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/transcriptions', apiGatewayMiddleware, this.getTranscriptions.bind(this));
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      // Extract user ID from token or use AWS API Gateway user context
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      console.log(`👤 Getting profile for user: ${userId.substring(0, 8)}...`);
      
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      console.log(`✅ Profile retrieved for user: ${user.username}`);
      
      res.json(user);
      
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      // Extract user ID from token or use AWS API Gateway user context
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      console.log(`👤 Updating profile for user: ${userId.substring(0, 8)}...`);
      
      const validatedInput = req.body as UpdateUserInput;
      
      const updatedUser = await this.userRepository.update(userId, validatedInput);
      
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      console.log(`✅ Profile updated for user: ${updatedUser.username}`);
      
      res.json(updatedUser);
      
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  }

  async getTranscriptions(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      // Extract user ID from token or use AWS API Gateway user context
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      console.log(`📝 Get user transcriptions: ${userId.substring(0, 8)}...`);

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transcriptions = await this.transcriptionRepository.findByUserId(userId, Math.min(limit, 100), Math.max(offset, 0));

      const total = await this.transcriptionRepository.countByUserId(userId);
      
      console.log(`✅ Retrieved ${transcriptions.length} transcriptions for user: ${userId.substring(0, 8)}...`);
      
      res.json({
        transcriptions,
        total
      });
      
    } catch (error: any) {
      console.error('Error getting user transcriptions:', error);
      res.status(500).json({ error: error.message || 'Failed to get transcriptions' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}