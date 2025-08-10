import { Router } from 'express';
import { IUserController } from '../controllers/user.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';

export class UserRoutes {
  private router: Router;

  constructor(
    private userController: IUserController,
    private authMiddleware: IAuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All user routes require authentication
    
    // Get user profile
    this.router.get('/profile', 
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.userController.getUserProfile(req, res)
    );

    // Update user profile
    this.router.put('/profile', 
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.userController.updateUserProfile(req, res)
    );

    // Get user transcriptions
    this.router.get('/transcriptions', 
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.userController.getUserTranscriptions(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}