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
  login(req: Request, res: Response): Promise<void>;
  verifyEmail(req: Request, res: Response): Promise<void>;
  forgotPassword(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
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
     * /api/auth/login:
     *   post:
     *     summary: User Login with AWS Cognito
     *     description: Authenticate user with AWS Cognito and return tokens for API Gateway authorization
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User email address
     *                 example: "john@example.com"
     *               password:
     *                 type: string
     *                 description: User password
     *                 example: "SecurePass123!"
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *                 accessToken:
     *                   type: string
     *                 refreshToken:
     *                   type: string
     *       401:
     *         description: Invalid credentials
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/login', apiGatewayMiddleware, this.login.bind(this));

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

    /**
     * @swagger
     * /api/auth/refresh-token:
     *   post:
     *     summary: Refresh Access Token
     *     description: Get new access token using refresh token
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - refreshToken
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 description: Valid refresh token
     *     responses:
     *       200:
     *         description: New access token generated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 accessToken:
     *                   type: string
     *                   description: New JWT access token
     *       401:
     *         description: Invalid refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    this.router.post('/refresh-token', apiGatewayMiddleware, this.refreshToken.bind(this));


  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 AWS Cognito user registration request');
      
      const validatedInput = req.body as RegisterInput;
      
      // Create user in AWS Cognito with pre-verified email
      const cognitoUser = await this.cognitoService.createUser(
        validatedInput.username,
        validatedInput.email,
        validatedInput.password,
        validatedInput.firstName,
        validatedInput.lastName
      );

      // Create user in our database for additional data
      const dbUser = await this.userRepository.create({
        username: validatedInput.username,
        email: validatedInput.email,
        password: validatedInput.password, // Required by CreateUserInput
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
      });
      
      console.log(`✅ AWS Cognito user registered: ${validatedInput.username}`);
      
      res.status(201).json({
        user: dbUser,
        message: "Registration successful. Your account is ready to use.",
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error registering user with Cognito:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      
      // Handle Cognito-specific errors
      if (error.message.includes('UsernameExistsException')) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      
      if (error.message.includes('InvalidParameterException')) {
        res.status(400).json({ error: 'Invalid registration parameters' });
        return;
      }
      
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 AWS Cognito user login attempt');
      
      const validatedInput = req.body as LoginInput;
      
      // Note: Login is handled entirely by the frontend with Cognito
      // This endpoint primarily serves to sync user data and validate tokens
      
      // Extract user info from Cognito tokens (if provided)
      const authHeader = req.headers.authorization;
      const idToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (idToken) {
        // Validate and extract user from Cognito ID token
        const tokenUser = this.cognitoService.extractUserFromToken(idToken);
        
        if (tokenUser) {
          // Fetch user from database
          const dbUser = await this.userRepository.findById(tokenUser.sub);
          
          if (dbUser) {
            console.log(`✅ AWS Cognito user authenticated: ${dbUser.username}`);
            
            res.json({
              user: dbUser,
              message: "Login successful",
              authProvider: "cognito"
            });
            return;
          }
        }
      }
      
      // For backward compatibility or direct login validation
      res.status(400).json({ 
        error: "Please use Cognito client-side authentication",
        authProvider: "cognito"
      });
      
    } catch (error: any) {
      console.error('Error in Cognito login flow:', error);
      res.status(401).json({ error: error.message || 'Login failed' });
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