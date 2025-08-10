import { Router } from 'express';
import { IAuthController } from '../controllers/auth.controller';

export class AuthRoutesSwagger {
  private router: Router;

  constructor(private authController: IAuthController) {
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
    this.router.post('/register', this.authController.register.bind(this.authController));

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
    this.router.post('/login', this.authController.login.bind(this.authController));

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
    this.router.post('/verify-email', this.authController.verifyEmail.bind(this.authController));

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
    this.router.post('/forgot-password', this.authController.forgotPassword.bind(this.authController));

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
    this.router.post('/reset-password', this.authController.resetPassword.bind(this.authController));

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
    this.router.post('/refresh-token', this.authController.refreshToken.bind(this.authController));

    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Get Current User
     *     description: Get authenticated user information
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User information retrieved
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
    this.router.get('/me', this.authController.getCurrentUser.bind(this.authController));
  }

  public getRouter(): Router {
    return this.router;
  }
}