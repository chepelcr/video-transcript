import { Request, Response, Router } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import { UpdateUserInput, RegisterInput } from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';
import { CognitoService, createCognitoService } from '../services/cognito.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';

export interface IUserController {
  register(req: Request, res: Response): Promise<void>;
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
     * /api/users:
     *   post:
     *     summary: Register User with AWS Cognito
     *     description: Register a new user account using AWS Cognito with automatic email verification
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *                 description: Unique username for the account
     *                 example: "johndoe"
     *               email:
     *                 type: string
     *                 format: email
     *                 description: Valid email address
     *                 example: "john@example.com"
     *               password:
     *                 type: string
     *                 minLength: 8
     *                 description: Strong password (min 8 characters)
     *                 example: "SecurePass123!"
     *               firstName:
     *                 type: string
     *                 description: User's first name
     *                 example: "John"
     *               lastName:
     *                 type: string
     *                 description: User's last name
     *                 example: "Doe"
     *               cognitoUserId:
     *                 type: string
     *                 description: AWS Cognito user ID (for auto-sync)
     *                 example: "148814f8-1091-705f-fe16-fb766b833a81"
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *                 message:
     *                   type: string
     *                   description: Registration status message
     *                 authProvider:
     *                   type: string
     *                   description: Authentication provider used
     *       400:
     *         description: Registration failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/', apiGatewayMiddleware, this.register.bind(this));

    /**
     * @swagger
     * /api/users/{userId}/verify-email-complete:
     *   post:
     *     summary: Complete Email Verification
     *     description: Called after successful email verification to send welcome materials
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: User ID
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
     *       400:
     *         description: User ID is required
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   description: Success message
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid request
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
    this.router.post('/:userId/verify-email-complete', apiGatewayMiddleware, this.verifyEmailComplete.bind(this));

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

  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 User registration/sync from Amplify');
      
      // Get user ID from request body (for auto-sync scenarios)
      const cognitoUserId = req.body?.cognitoUserId;
      
      // If this is an auto-sync call with just cognitoUserId, get user from Cognito
      if (cognitoUserId && Object.keys(req.body).length === 1 && req.body.cognitoUserId) {
        console.log('Auto-sync call detected with Cognito user ID:', cognitoUserId);

        // Check if user already exists
        const existingUser = await this.userRepository.findById(cognitoUserId);
        if (existingUser) {
          console.log(`✅ User already exists: ${existingUser.username}`);
          res.status(200).json(existingUser);
          return;
        }

        // Get user data from Cognito using the service
        const cognitoUserData = await this.cognitoService.getUser(cognitoUserId);
        
        if (!cognitoUserData) {
          res.status(400).json({ error: 'Failed to get user data from Cognito' });
          return;
        }

        // Create user with Cognito data
        const dbUser = await this.userRepository.createWithCognitoId({
          id: cognitoUserId,
          username: cognitoUserData.email.split('@')[0], // Generate username from email
          email: cognitoUserData.email,
          firstName: cognitoUserData.firstName,
          lastName: cognitoUserData.lastName,
        });
        
        // Note: Welcome email will be sent after email verification is completed
        
        console.log(`✅ User auto-synced from Cognito: ${dbUser.username}`);
        res.status(201).json(dbUser);
        return;
      }
      
      // Handle normal registration with body data
      const validatedInput = req.body as RegisterInput & { cognitoUserId?: string };
      
      // Check if user already exists in our database
      const existingUser = await this.userRepository.findByEmail(validatedInput.email);
      if (existingUser) {
        console.log(`✅ User already exists in database: ${validatedInput.username}`);
        res.status(200).json({
          user: existingUser,
          message: "User already registered",
          authProvider: "cognito"
        });
        return;
      }

      // Create user in our database for additional data, using Cognito user ID if provided
      const dbUser = await this.userRepository.createWithCognitoId({
        id: validatedInput.cognitoUserId, // Use Cognito user ID if provided
        username: validatedInput.username,
        email: validatedInput.email,
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
      });
      
      // Note: Welcome email will be sent after email verification is completed
      
      console.log(`✅ User synced to database: ${validatedInput.username}`);
      
      res.status(201).json({
        user: dbUser,
        message: "Registration sync successful",
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error syncing user registration:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      
      res.status(400).json({ error: error.message || 'Failed to register/sync user' });
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
      
      // Find user by ID
      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Get language from query parameter or detect from headers
      const userLanguage = req.query.language as string || this.detectUserLanguage(req);
      
      // Send welcome email and create notification
      try {
        console.log(`🎉 Sending welcome materials for verified user: ${user.email}`);
        
        // Send welcome email (async, don't block response)
        this.emailService.sendWelcomeEmail(
          user.email, 
          user.firstName || '', 
          user.lastName || '',
          userLanguage
        ).catch(error => {
          console.error('Failed to send welcome email:', error);
        });
        
        // Create welcome notification
        await this.notificationService.createWelcomeNotification(
          user.id,
          user.firstName || '',
          userLanguage
        );
        
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