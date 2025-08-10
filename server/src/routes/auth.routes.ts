import { Router } from 'express';
import { IAuthController } from '../controllers/auth.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';

export class AuthRoutes {
  private router: Router;

  constructor(
    private authController: IAuthController,
    private authMiddleware: IAuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public routes
    this.router.post('/register', (req, res) => this.authController.register(req, res));
    this.router.post('/login', (req, res) => this.authController.login(req, res));
    this.router.post('/refresh-token', (req, res) => this.authController.refreshToken(req, res));

    // Protected routes
    this.router.get('/me', 
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.authController.me(req, res)
    );
    
    this.router.post('/logout',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.authController.logout(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}