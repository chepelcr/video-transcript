import { Router } from 'express';
import { IHealthController } from '../controllers/health.controller';

export class HealthRoutes {
  private router: Router;

  constructor(private healthController: IHealthController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Standard health check endpoint
    this.router.get('/health', (req, res) => this.healthController.getHealth(req, res));
    
    // Kubernetes-style endpoints
    this.router.get('/readiness', (req, res) => this.healthController.getReadiness(req, res));
    this.router.get('/liveness', (req, res) => this.healthController.getLiveness(req, res));
    
    // Alternative endpoints (common patterns)
    this.router.get('/ready', (req, res) => this.healthController.getReadiness(req, res));
    this.router.get('/live', (req, res) => this.healthController.getLiveness(req, res));
    this.router.get('/ping', (req, res) => {
      res.status(200).json({ 
        status: 'pong', 
        timestamp: new Date().toISOString() 
      });
    });
  }

  getRouter(): Router {
    return this.router;
  }
}