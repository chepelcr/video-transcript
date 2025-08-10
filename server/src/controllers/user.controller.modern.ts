import { Request, Response, Router } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { UpdateUserInput } from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

export interface IUserController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class UserController implements IUserController {
  private router: Router;

  constructor(
    private userRepository: IUserRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/users/{userId}/profile:
     *   get:
     *     summary: Get User Profile
     *     description: Get detailed user profile information
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
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
     *       403:
     *         description: User can only access their own profile
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/:userId/profile', apiGatewayMiddleware, this.getProfile.bind(this));

    /**
     * @swagger
     * /api/users/{userId}/profile:
     *   put:
     *     summary: Update User Profile
     *     description: Update user profile information (username, firstName, lastName)
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *                 description: New username (3-20 characters)
     *                 example: "johndoe123"
     *               firstName:
     *                 type: string
     *                 description: User's first name
     *                 example: "John"
     *               lastName:
     *                 type: string
     *                 description: User's last name
     *                 example: "Doe"
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid input or username already taken
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
     *       403:
     *         description: User can only update their own profile
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.put('/:userId/profile', apiGatewayMiddleware, this.updateProfile.bind(this));


  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // AWS API Gateway handles authorization - verify user can access this profile
      const authenticatedUserId = req.headers['x-user-id'] as string;
      
      if (authenticatedUserId && userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only access your own profile' });
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
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // AWS API Gateway handles authorization - verify user can update this profile
      const authenticatedUserId = req.headers['x-user-id'] as string;
      
      if (authenticatedUserId && userId !== authenticatedUserId) {
        res.status(403).json({ error: 'You can only update your own profile' });
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



  public getRouter(): Router {
    return this.router;
  }
}