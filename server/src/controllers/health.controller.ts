import { Request, Response } from 'express';
import { db } from '../config/database';

export interface IHealthController {
  getHealth(req: Request, res: Response): Promise<void>;
  getReadiness(req: Request, res: Response): Promise<void>;
  getLiveness(req: Request, res: Response): Promise<void>;
}

export class HealthController implements IHealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: await this.checkServices()
      };

      const allHealthy = Object.values(healthData.services).every(service => service.status === 'healthy');
      const statusCode = allHealthy ? 200 : 503;

      res.status(statusCode).json(healthData);
      
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  }

  async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const services = await this.checkServices();
      const allReady = Object.values(services).every(service => service.status === 'healthy');

      if (allReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          services
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          services
        });
      }
      
    } catch (error) {
      console.error('Readiness check error:', error);
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      });
    }
  }

  async getLiveness(req: Request, res: Response): Promise<void> {
    try {
      // Basic liveness check - just verify the process is running
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
      
    } catch (error) {
      console.error('Liveness check error:', error);
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: 'Liveness check failed'
      });
    }
  }

  private async checkServices(): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    // Check database connection
    try {
      await db.execute('SELECT 1');
      services.database = {
        status: 'healthy',
        responseTime: Date.now(),
        details: 'PostgreSQL connection successful'
      };
    } catch (error) {
      services.database = {
        status: 'unhealthy',
        error: error.message,
        details: 'PostgreSQL connection failed'
      };
    }

    // Check AWS SQS (if configured)
    services.sqs = {
      status: process.env.SQS_QUEUE_URL ? 'healthy' : 'not_configured',
      details: process.env.SQS_QUEUE_URL ? 'SQS queue configured' : 'SQS not configured'
    };

    // Check email service (AWS SES)
    services.email = {
      status: (process.env.AWS_SES_SMTP_USERNAME && process.env.AWS_SES_SMTP_PASSWORD) ? 'healthy' : 'not_configured',
      details: (process.env.AWS_SES_SMTP_USERNAME && process.env.AWS_SES_SMTP_PASSWORD) ? 'Email service configured' : 'Email service not configured'
    };

    // Check payment services
    services.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'not_configured',
      details: process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Stripe not configured'
    };

    services.paypal = {
      status: (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) ? 'healthy' : 'not_configured',
      details: (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) ? 'PayPal configured' : 'PayPal not configured'
    };

    return services;
  }
}