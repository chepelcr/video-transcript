import { Request, Response, Router } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { UpdateUserInput } from '../models/user.model';
// Removed apiGatewayMiddleware import - authentication now handled by AWS API Gateway
import { CognitoService, createCognitoService } from '../services/cognito.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';

export interface IUserController {
  getProfile(req: Request, res: Response): Promise<void>;
  updateProfile(req: Request, res: Response): Promise<void>;
  verifyEmailComplete(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class UserController implements IUserController {
  private router: Router;
  private cognitoService: CognitoService;
  private emailService: EmailService;
  private notificationService: NotificationService;

  constructor(
    private userRepository: IUserRepository
  ) {
    this.router = Router();
    this.cognitoService = createCognitoService();
    this.emailService = new EmailService();
    this.notificationService = new NotificationService();
    this.setupRoutes();
  }

  private setupRoutes(): void {


    /**
     * @swagger
     * /api/users/{userId}/verify-email-complete:
     *   post:
     *     summary: Complete Email Verification
     *     description: |
     *       Called after successful email verification to send welcome materials.
     *       This endpoint automatically creates user records from JWT token data if the user 
     *       doesn't exist in the database yet, then sends welcome email and notifications.
     *       
     *       **Security**: Authentication handled by AWS API Gateway with Cognito authorizer.
     *       User data is extracted from decoded JWT claims passed as headers by API Gateway.
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: AWS Cognito User ID (validated by API Gateway)
     *         example: "54384458-c0d1-705c-3ebb-46cf191cd791"
     *       - in: query
     *         name: language
     *         required: false
     *         schema:
     *           type: string
     *           enum: [en, es]
     *           default: en
     *         description: Language for welcome email and notifications
     *         example: "es"
     *     responses:
     *       200:
     *         description: Welcome materials sent successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   description: Success message
     *                   example: "Welcome materials sent successfully"
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       400:
     *         description: User ID is required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Unauthorized - API Gateway validation failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: User not found in Cognito
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/:userId/verify-email-complete', this.verifyEmailComplete.bind(this));

    /**
     * @swagger
     * /api/users/{userId}/profile:
     *   get:
     *     summary: Get User Profile
     *     description: |
     *       Get detailed user profile information for the authenticated user.
     *       
     *       **Security**: Authentication handled by AWS API Gateway with Cognito authorizer.
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: AWS Cognito User ID (validated by API Gateway)
     *         example: "54384458-c0d1-705c-3ebb-46cf191cd791"
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       403:
     *         description: Unauthorized - API Gateway validation failed
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
    this.router.get('/:userId/profile', this.getProfile.bind(this));

    /**
     * @swagger
     * /api/users/{userId}/profile:
     *   put:
     *     summary: Update User Profile
     *     description: |
     *       Update user profile information (username, firstName, lastName).
     *       
     *       **Security**: Authentication handled by AWS API Gateway with Cognito authorizer.
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: AWS Cognito User ID (validated by API Gateway)
     *         example: "54384458-c0d1-705c-3ebb-46cf191cd791"
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
    this.router.put('/:userId/profile', this.updateProfile.bind(this));


  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Note: AWS API Gateway handles authorization - userId in path is already validated

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

      // Note: AWS API Gateway handles authorization - userId in path is already validated

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



  /**
   * Called after email verification is completed to send welcome materials
   */
  async verifyEmailComplete(req: Request, res: Response): Promise<void> {
    try {
      console.log('📧 Processing email verification completion');
      
      const userId = req.params.userId;
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      // Note: AWS API Gateway handles authorization - userId in path is already validated
      
      console.log(`🔍 Finding user by ID: ${userId.substring(0, 8)}...`);
      
      // First check if user exists in our database
      let user = await this.userRepository.findById(userId);
      
      if (!user) {
        console.log('User not found in database, creating from JWT token data...');
        
        // Extract user data from JWT token via API Gateway headers
        // In production, AWS API Gateway will pass decoded JWT claims as headers
        const email = req.headers['x-user-email'] as string || 
                     req.headers['cognito-email'] as string || 
                     `user-${userId}@example.com`; // Fallback for development
        
        const firstName = req.headers['x-user-given-name'] as string || 
                         req.headers['cognito-given-name'] as string || 
                         undefined;
        
        const lastName = req.headers['x-user-family-name'] as string || 
                        req.headers['cognito-family-name'] as string || 
                        undefined;
        
        const username = email.split('@')[0]; // Generate username from email
        
        console.log(`Creating user from JWT data: ${email} (${username})`);
        
        // Create user in our database using JWT token data
        user = await this.userRepository.createWithCognitoId({
          id: userId,
          email: email,
          username: username,
          firstName: firstName,
          lastName: lastName
        });
        
        console.log(`✅ User created from JWT token: ${user.username} (${user.email})`);
      } else {
        console.log(`✅ Found user: ${user.username} (${user.email})`);
      }
      
      // Get language from query parameter or detect from headers
      const userLanguage = req.query.language as string || this.detectUserLanguage(req);
      
      // Send welcome email and create notification
      try {
        console.log(`🎉 Sending welcome materials for verified user: ${user.email}`);
        
        // Send welcome email
        const fullName = user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          user.firstName || user.username;
        
        await this.emailService.sendWelcomeEmail(user.email, fullName, userLanguage);
        
        // Create welcome notification
        await this.notificationService.createWelcomeNotification(userId, fullName, userLanguage);
        
        console.log(`✅ Welcome materials sent for verified user: ${user.username} (${userLanguage})`);
        
        res.status(200).json({ 
          message: 'Welcome materials sent successfully',
          user: user
        });
        
      } catch (error) {
        console.error('Failed to send welcome materials:', error);
        res.status(500).json({ error: 'Failed to send welcome materials' });
      }
      
    } catch (error: any) {
      console.error('Error processing email verification completion:', error);
      res.status(500).json({ error: error.message || 'Failed to process verification completion' });
    }
  }

  /**
   * Detect user language from request headers or URL path
   */
  private detectUserLanguage(req: Request): string {
    try {
      // Check Accept-Language header
      const acceptLanguage = req.headers['accept-language'];
      if (acceptLanguage && acceptLanguage.includes('es')) {
        return 'es';
      }
      
      // Check for language in request body
      if (req.body?.language) {
        return req.body.language === 'es' ? 'es' : 'en';
      }
      
      // Check URL path for language indicator
      const referer = req.headers.referer || req.headers.referrer;
      if (referer && referer.includes('/es')) {
        return 'es';
      }
      
      return 'en'; // Default to English
    } catch (error) {
      console.warn('Failed to detect user language:', error);
      return 'en';
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}