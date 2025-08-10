import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../services/auth.service';
import { AuthRequest } from '../types/auth.types';

export interface IAuthMiddleware {
  authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
  optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}

export class AuthMiddleware implements IAuthMiddleware {
  constructor(private authService: IAuthService) {}

  async authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access token required' });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      const user = await this.authService.verifyToken(token);
      if (!user) {
        res.status(401).json({ error: 'Invalid access token' });
        return;
      }

      req.userId = user.id;
      next();
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  // Optional authentication - allows anonymous usage
  async optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided - continue as anonymous user
        req.userId = null;
        next();
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const user = await this.authService.verifyToken(token);
        req.userId = user ? user.id : null;
      } catch (tokenError) {
        console.log('Token verification failed, continuing as anonymous:', tokenError.message);
        req.userId = null;
      }
      
      next();
      
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Still continue as anonymous even if middleware fails
      req.userId = null;
      next();
    }
  }
}