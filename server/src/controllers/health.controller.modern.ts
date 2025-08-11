import { Request, Response, Router } from 'express';
// Removed apiGatewayMiddleware import - authentication now handled by AWS API Gateway

export interface IHealthController {
  health(req: Request, res: Response): Promise<void>;
  ping(req: Request, res: Response): Promise<void>;
  readiness(req: Request, res: Response): Promise<void>;
  liveness(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class HealthController implements IHealthController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/health:
     *   get:
     *     summary: Health Check
     *     description: Get overall system health status
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: System is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "healthy"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 uptime:
     *                   type: number
     *                   description: Process uptime in seconds
     *                 environment:
     *                   type: string
     *                 version:
     *                   type: string
     *                 services:
     *                   type: object
     *                   properties:
     *                     database:
     *                       type: string
     *                       example: "connected"
     *                     aws:
     *                       type: string
     *                       example: "available"
     */
    this.router.get('/health', this.health.bind(this));

    /**
     * @swagger
     * /api/ping:
     *   get:
     *     summary: Simple Ping
     *     description: Simple ping endpoint for basic connectivity test
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Pong response
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "pong"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    this.router.get('/ping', this.ping.bind(this));

    /**
     * @swagger
     * /api/readiness:
     *   get:
     *     summary: Readiness Probe
     *     description: Check if service is ready to handle requests
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is ready
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "ready"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *       503:
     *         description: Service is not ready
     */
    this.router.get('/readiness', this.readiness.bind(this));

    /**
     * @swagger
     * /api/liveness:
     *   get:
     *     summary: Liveness Probe
     *     description: Check if service is alive and running
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is alive
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "alive"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    this.router.get('/liveness', this.liveness.bind(this));
  }

  async health(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'connected', // This would check actual DB status
          aws: 'available', // This would check AWS services
        }
      };

      console.log('🩺 Health check requested');
      res.json(healthCheck);
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async ping(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        message: 'pong',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Ping failed:', error);
      res.status(500).json({
        message: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Check if all dependencies are ready
      const isReady = true; // This would check actual readiness conditions
      
      if (isReady) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async liveness(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        status: 'alive',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Liveness check failed:', error);
      res.status(500).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}