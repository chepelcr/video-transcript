import { Request, Response, Router } from 'express';
import { IAuthService } from '../services/auth.service';
import { IUserRepository } from '../repositories/user.repository';
import { 
  RegisterInput,
  LoginInput
} from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';
import { CognitoService, createCognitoService } from '../services/cognito.service';

export interface IAuthController {
  register(req: Request, res: Response): Promise<void>;
  me(req: Request, res: Response): Promise<void>;
  verifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class AuthController implements IAuthController {
  private router: Router;
  private cognitoService: CognitoService;

  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository
  ) {
    this.router = Router();
    this.cognitoService = createCognitoService();
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

    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Get Current User
     *     description: Get current authenticated user information from Cognito JWT token
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User information retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Invalid or missing authentication token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: User not found in database
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.get('/me', apiGatewayMiddleware, this.me.bind(this));

    /**
     * @swagger
     * /api/auth/verify-email:
     *   post:
     *     summary: Verify Email
     *     description: Verify user email with verification code
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - code
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *                 example: "john@example.com"
     *               code:
     *                 type: string
     *                 description: 6-digit verification code
     *                 example: "ABC123"
     *     responses:
     *       200:
     *         description: Email verified successfully
     *       400:
     *         description: Invalid or expired verification code
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/verify-email', apiGatewayMiddleware, this.verifyEmail.bind(this));

    /**
     * @swagger
     * /api/auth/forgot-password:
     *   post:
     *     summary: Forgot Password
     *     description: Request password reset email
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *                 example: "john@example.com"
     *     responses:
     *       200:
     *         description: Password reset email sent (if account exists)
     */
    this.router.post('/forgot-password', apiGatewayMiddleware, this.forgotPassword.bind(this));

    /**
     * @swagger
     * /api/auth/reset-password:
     *   post:
     *     summary: Reset Password
     *     description: Reset password using reset token
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - token
     *               - newPassword
     *             properties:
     *               token:
     *                 type: string
     *                 description: Password reset token from email
     *               newPassword:
     *                 type: string
     *                 minLength: 8
     *                 description: New password
     *     responses:
     *       200:
     *         description: Password reset successfully
     *       400:
     *         description: Invalid or expired reset token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/reset-password', apiGatewayMiddleware, this.resetPassword.bind(this));

    // Note: Token refresh is handled automatically by AWS Amplify
    // No backend refresh endpoint needed


  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 User registration sync from Amplify');
      
      const validatedInput = req.body as RegisterInput & { cognitoUserId?: string };
      
      // Note: With Amplify, user registration happens on the frontend
      // This endpoint just syncs the user data to our database
      
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
        password: validatedInput.password, // Required by CreateUserInput
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
      });
      
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
      
      res.status(400).json({ error: error.message || 'Registration sync failed' });
    }
  }

  // Note: Login is handled entirely by AWS Amplify frontend
  // No backend login endpoint needed

  async me(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 Getting current user from Cognito token');
      
      // Extract user info from Cognito ID token
      const authHeader = req.headers.authorization;
      const idToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!idToken) {
        res.status(401).json({ error: "No authorization token provided" });
        return;
      }
      
      // Validate and extract user from Cognito ID token
      const tokenUser = this.cognitoService.extractUserFromToken(idToken);
      
      if (!tokenUser) {
        res.status(401).json({ error: "Invalid authorization token" });
        return;
      }
      
      // Fetch user from database
      const dbUser = await this.userRepository.findById(tokenUser.sub);
      
      if (!dbUser) {
        res.status(404).json({ error: "User not found in database" });
        return;
      }
      
      console.log(`✅ Current user retrieved: ${dbUser.username}`);
      
      res.json({
        username: dbUser.username,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        id: dbUser.id,
        createdAt: dbUser.createdAt,
        transcriptionsUsed: dbUser.transcriptionsUsed || 0,
        hasPaidPlan: dbUser.hasPaidPlan || false
      });
      
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      console.log('📧 AWS Cognito email verification (handled client-side)');
      
      const { email } = req.body;
      
      // With Cognito, emails are pre-verified during registration
      // This endpoint exists for API compatibility
      
      console.log(`✅ Email verification handled by Cognito: ${email}`);
      
      res.json({ 
        message: 'Email verification handled by AWS Cognito',
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error in email verification flow:', error);
      res.status(400).json({ error: error.message || 'Email verification failed' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔑 AWS Cognito password reset request');
      
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      
      // Initiate password reset through Cognito
      await this.cognitoService.initiatePasswordReset(email);
      
      console.log(`✅ Cognito password reset initiated for: ${email}`);
      
      res.json({ 
        message: 'Password reset code sent to your email',
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error processing Cognito password reset:', error);
      
      // Handle Cognito-specific errors
      if (error.message.includes('UserNotFoundException')) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.status(400).json({ error: error.message || 'Password reset failed' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 AWS Cognito password reset confirmation');
      
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        res.status(400).json({ error: 'Email, verification code, and new password are required' });
        return;
      }
      
      // Confirm password reset through Cognito
      await this.cognitoService.confirmPasswordReset(email, code, newPassword);
      
      console.log('✅ Cognito password reset successful');
      
      res.json({ 
        message: 'Password reset successful',
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error confirming Cognito password reset:', error);
      
      // Handle Cognito-specific errors
      if (error.message.includes('CodeMismatchException')) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }
      
      if (error.message.includes('ExpiredCodeException')) {
        res.status(400).json({ error: 'Verification code has expired' });
        return;
      }
      
      res.status(400).json({ error: error.message || 'Password reset failed' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 AWS Cognito token refresh (handled client-side)');
      
      // With Cognito, token refresh is handled client-side
      // This endpoint exists for API compatibility but directs to client-side handling
      
      res.json({
        message: 'Token refresh handled by AWS Cognito client SDK',
        authProvider: "cognito",
        instruction: "Use CognitoAuthService.refreshSession() on the client"
      });
      
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      res.status(401).json({ error: error.message || 'Token refresh failed' });
    }
  }



  public getRouter(): Router {
    return this.router;
  }
}