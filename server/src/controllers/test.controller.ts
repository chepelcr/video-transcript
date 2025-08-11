import { Request, Response, Router } from 'express';
import { IEmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';

/**
 * Test controller for demonstrating features (development only)
 */
export class TestController {
  private router: Router = Router();
  private emailService: IEmailService;
  private notificationService: NotificationService;

  constructor(
    emailService: IEmailService,
    notificationService: NotificationService
  ) {
    this.emailService = emailService;
    this.notificationService = notificationService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/welcome-email', this.testWelcomeEmail.bind(this));
  }

  /**
   * Test welcome email in different languages
   */
  private async testWelcomeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, firstName, lastName, language } = req.body;

      if (!email || !firstName) {
        res.status(400).json({ error: 'Email and firstName are required' });
        return;
      }

      console.log(`🧪 Testing welcome email for ${firstName} in ${language || 'en'}`);

      // Detect language from request or use provided language
      const userLanguage = language || this.detectUserLanguage(req);

      // Send welcome email
      const emailResult = await this.emailService.sendWelcomeEmail(
        email,
        firstName,
        lastName,
        userLanguage
      );

      if (emailResult) {
        res.json({
          success: true,
          message: `Welcome email sent successfully in ${userLanguage}`,
          language: userLanguage,
          recipient: email,
          name: `${firstName} ${lastName || ''}`.trim()
        });
      } else {
        res.status(500).json({
          error: 'Failed to send welcome email',
          language: userLanguage
        });
      }
    } catch (error) {
      console.error('Test welcome email error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Detect user language from request headers or body
   */
  private detectUserLanguage(req: Request): string {
    try {
      // Check request body first
      if (req.body?.language) {
        return req.body.language === 'es' ? 'es' : 'en';
      }

      // Check Accept-Language header
      const acceptLanguage = req.headers['accept-language'];
      if (acceptLanguage && acceptLanguage.includes('es')) {
        return 'es';
      }

      return 'en'; // Default to English
    } catch (error) {
      console.warn('Failed to detect user language:', error);
      return 'en';
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}