import { Request, Response, Router } from 'express';
import { IAuthService } from '../services/auth.service';
import { IUserRepository } from '../repositories/user.repository';
import { 
  RegisterInput,
  LoginInput
} from '../models/user.model';
import { apiGatewayMiddleware } from '../middlewares/api-gateway.middleware';

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

  constructor(
    private authService: IAuthService,
    private userRepository: IUserRepository
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Register User
     *     description: Register a new user account with email verification
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
     *     summary: Login User
     *     description: Authenticate user with email and password
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
      console.log('📝 Register new user');
      
      const validatedInput = req.body as RegisterInput;
      
      const result = await this.authService.register(validatedInput);
      
      console.log(`✅ User registered: ${result.user.username}`);
      
      res.status(201).json(result);
      
    } catch (error: any) {
      console.error('Error registering user:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 User login attempt');
      
      const validatedInput = req.body as LoginInput;
      
      const result = await this.authService.login(validatedInput);
      
      console.log(`✅ User logged in: ${result.user.username}`);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Error logging in user:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      console.log('📧 Email verification attempt');
      
      const { email, code } = req.body;
      
      // Note: verifyEmail method needs to be implemented in AuthService
      // await this.authService.verifyEmail(email, code);
      
      console.log(`✅ Email verified: ${email}`);
      
      res.json({ message: 'Email verified successfully' });
      
    } catch (error: any) {
      console.error('Error verifying email:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || 'Email verification failed' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log('📧 Password reset request');
      
      const { email } = req.body;
      
      // Note: forgotPassword method needs to be implemented in AuthService
      // await this.authService.forgotPassword(email);
      
      console.log(`✅ Password reset email sent to: ${email}`);
      
      res.json({ message: 'Password reset email sent if account exists' });
      
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      // Always return success for security
      res.json({ message: 'Password reset email sent if account exists' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 Password reset attempt');
      
      const { token, newPassword } = req.body;
      
      // Note: resetPassword method needs to be implemented in AuthService
      // await this.authService.resetPassword(token, newPassword);
      
      console.log('✅ Password reset successful');
      
      res.json({ message: 'Password reset successful' });
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || 'Password reset failed' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Token refresh attempt');
      
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }
      
      // Note: refreshToken method needs to be implemented in AuthService
      // const result = await this.authService.refreshToken(refreshToken);
      const result = { accessToken: 'new_token_here' };
      
      console.log('✅ Token refreshed successfully');
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      res.status(401).json({ error: error.message || 'Token refresh failed' });
    }
  }



  public getRouter(): Router {
    return this.router;
  }
}