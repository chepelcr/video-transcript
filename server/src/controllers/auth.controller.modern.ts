import { Request, Response, Router } from 'express';
import { IAuthService } from '../services/auth.service';
import { IUserRepository } from '../repositories/user.repository';
import { 
  RegisterInput,
  LoginInput
} from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';
import { CognitoService, createCognitoService } from '../services/cognito.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';

export interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  verifyEmailComplete(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class AuthController implements IAuthController {
  private router: Router;
  private cognitoService: CognitoService;
  private emailService: EmailService;
  private notificationService: NotificationService;

  constructor(
    private authService: IAuthService,
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
     * /api/auth/register:
     *   post:
     *     summary: Register User with AWS Cognito
     *     description: Register a new user account using AWS Cognito with automatic email verification
     *     tags: [Authentication]
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
     *                 accessToken:
     *                   type: string
     *                   description: JWT access token
     *                 refreshToken:
     *                   type: string
     *                   description: JWT refresh token
     *       400:
     *         description: Registration failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/register', apiGatewayMiddleware, this.register.bind(this));
    this.router.post('/verify-email-complete', apiGatewayMiddleware, this.verifyEmailComplete.bind(this));

    // Note: Authentication is handled entirely by AWS Amplify
    // - Email verification: Handled by Amplify
    // - Password reset: Handled by Amplify  
    // - Login/logout: Handled by Amplify
    // - Token refresh: Handled automatically by Amplify


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
      
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Detect language from request headers or use default
      const userLanguage = this.detectUserLanguage(req);
      
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

  // Note: All authentication operations are handled by AWS Amplify:
  // - Email verification: Handled by Amplify Auth
  // - Password reset: Handled by Amplify Auth
  // - Token refresh: Handled automatically by Amplify Auth
  // - User profile access: Use /users/{userId}/profile endpoint



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