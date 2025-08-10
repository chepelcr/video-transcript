import { Router } from 'express';
import { IPaymentController } from '../controllers/payment.controller';
import { IAuthMiddleware } from '../middlewares/auth.middleware';

export class PaymentRoutes {
  private router: Router;

  constructor(
    private paymentController: IPaymentController,
    private authMiddleware: IAuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Stripe routes - require authentication
    this.router.post('/stripe/create-payment-intent',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.paymentController.createPaymentIntent(req, res)
    );

    this.router.post('/stripe/get-or-create-subscription',
      (req, res, next) => this.authMiddleware.authenticate(req, res, next),
      (req, res) => this.paymentController.getOrCreateSubscription(req, res)
    );

    // PayPal routes - public (no auth required for PayPal SDK integration)
    this.router.get('/paypal/setup', (req, res) => 
      this.paymentController.getPaypalClientToken(req, res)
    );

    this.router.post('/paypal/order', (req, res) => 
      this.paymentController.createPaypalOrder(req, res)
    );

    this.router.post('/paypal/order/:orderID/capture', (req, res) => 
      this.paymentController.capturePaypalOrder(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}