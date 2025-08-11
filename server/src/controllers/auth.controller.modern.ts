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



    // Note: Authentication is handled entirely by AWS Amplify
    // - Email verification: Handled by Amplify
    // - Password reset: Handled by Amplify  
    // - Login/logout: Handled by Amplify
    // - Token refresh: Handled automatically by Amplify


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

  // Note: All authentication operations are handled by AWS Amplify:
  // - Email verification: Handled by Amplify Auth
  // - Password reset: Handled by Amplify Auth
  // - Token refresh: Handled automatically by Amplify Auth
  // - User profile access: Use /users/{userId}/profile endpoint



  public getRouter(): Router {
    return this.router;
  }
}