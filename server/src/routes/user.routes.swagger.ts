import { Router } from 'express';
import { IUserController } from '../controllers/user.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';

export class UserRoutesSwagger {
  private router: Router;

  constructor(
    private userController: IUserController,
    private authMiddleware: IAuthMiddleware
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
     *     security:
     *       - bearerAuth: []
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
    this.router.get(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.userController.getProfile.bind(this.userController)
    );

    /**
     * @swagger
     * /api/users/profile:
     *   put:
     *     summary: Update User Profile
     *     description: Update user profile information (username only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
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
    this.router.put(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.userController.updateProfile.bind(this.userController)
    );

    /**
     * @swagger
     * /api/users/transcriptions:
     *   get:
     *     summary: Get User Transcriptions (Legacy)
     *     description: Get all transcriptions for authenticated user (legacy endpoint, use /users/{userId}/transcriptions instead)
     *     tags: [Users]
     *     deprecated: true
     *     security:
     *       - bearerAuth: []
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
    this.router.get(
      '/transcriptions',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.userController.getTranscriptions.bind(this.userController)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}