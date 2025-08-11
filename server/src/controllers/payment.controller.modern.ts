import { Request, Response, Router } from 'express';
import { IUserRepository } from '../repositories/user.repository';
import Stripe from 'stripe';
// Removed apiGatewayMiddleware import - authentication now handled by AWS API Gateway

// PayPal imports
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";

export interface IPaymentController {
  createPaymentIntent(req: Request, res: Response): Promise<void>;
  createSubscription(req: Request, res: Response): Promise<void>;
  getOrCreateSubscription(req: Request, res: Response): Promise<void>;
  setupPaypal(req: Request, res: Response): Promise<void>;
  createPaypalOrder(req: Request, res: Response): Promise<void>;
  capturePaypalOrder(req: Request, res: Response): Promise<void>;
  getRouter(): Router;
}

export class PaymentController implements IPaymentController {
  private router: Router;
  private stripe: Stripe;
  private paypalClient: Client;
  private ordersController: OrdersController;
  private oAuthController: OAuthAuthorizationController;

  constructor(private userRepository: IUserRepository) {
    this.router = Router();
    
    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    });

    // Initialize PayPal
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('Missing PayPal credentials');
    }
    
    this.paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment: process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
      logging: { logLevel: LogLevel.Info, logRequest: { logBody: true }, logResponse: { logHeaders: true } },
    });
    
    this.ordersController = new OrdersController(this.paypalClient);
    this.oAuthController = new OAuthAuthorizationController(this.paypalClient);

    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /api/payments/create-payment-intent:
     *   post:
     *     summary: Create Stripe Payment Intent
     *     description: Create a payment intent for one-time payment
     *     tags: [Payments]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *             properties:
     *               amount:
     *                 type: number
     *                 description: Payment amount in dollars
     *                 example: 29.99
     *     responses:
     *       200:
     *         description: Payment intent created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 clientSecret:
     *                   type: string
     *                   description: Stripe client secret for payment completion
     */
    this.router.post('/create-payment-intent', this.createPaymentIntent.bind(this));

    /**
     * @swagger
     * /api/payments/get-or-create-subscription:
     *   post:
     *     summary: Get or Create Subscription
     *     description: Get existing subscription or create new one
     *     tags: [Payments]
     *     responses:
     *       200:
     *         description: Subscription details
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 subscriptionId:
     *                   type: string
     *                 clientSecret:
     *                   type: string
     */
    this.router.post('/get-or-create-subscription', this.getOrCreateSubscription.bind(this));

    /**
     * @swagger
     * /api/payments/paypal/setup:
     *   get:
     *     summary: Setup PayPal
     *     description: Get PayPal client token for SDK initialization
     *     tags: [Payments]
     *     responses:
     *       200:
     *         description: PayPal client token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 clientToken:
     *                   type: string
     */
    this.router.get('/paypal/setup', this.setupPaypal.bind(this));

    /**
     * @swagger
     * /api/payments/paypal/order:
     *   post:
     *     summary: Create PayPal Order
     *     description: Create PayPal order for payment processing
     *     tags: [Payments]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *               - currency
     *               - intent
     *             properties:
     *               amount:
     *                 type: string
     *                 example: "29.99"
     *               currency:
     *                 type: string
     *                 example: "USD"
     *               intent:
     *                 type: string
     *                 example: "CAPTURE"
     *     responses:
     *       200:
     *         description: PayPal order created
     */
    this.router.post('/paypal/order', this.createPaypalOrder.bind(this));

    /**
     * @swagger
     * /api/payments/paypal/order/{orderID}/capture:
     *   post:
     *     summary: Capture PayPal Order
     *     description: Capture payment for PayPal order
     *     tags: [Payments]
     *     parameters:
     *       - in: path
     *         name: orderID
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: PayPal order captured
     */
    this.router.post('/paypal/order/:orderID/capture', this.capturePaypalOrder.bind(this));
  }

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      console.log('💳 Creating Stripe payment intent');
      
      const { amount } = req.body;
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      
      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      
      res.json({ clientSecret: paymentIntent.client_secret });
      
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Error creating payment intent: ' + error.message });
    }
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      console.log('📅 Creating Stripe subscription');
      
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Create subscription logic here
      res.json({ message: 'Subscription creation not fully implemented' });
      
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
  }

  async getOrCreateSubscription(req: Request, res: Response): Promise<void> {
    try {
      console.log('📅 Get or create Stripe subscription');
      
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'User ID not found' });
        return;
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get or create subscription logic here
      res.json({ message: 'Get or create subscription not fully implemented' });
      
    } catch (error: any) {
      console.error('Error getting or creating subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to get or create subscription' });
    }
  }

  async setupPaypal(req: Request, res: Response): Promise<void> {
    try {
      console.log('🏦 Setting up PayPal client token');
      
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

      const { result } = await this.oAuthController.requestToken(
        { authorization: `Basic ${auth}` },
        { intent: 'sdk_init', response_type: 'client_token' }
      );

      console.log('✅ PayPal client token generated');
      
      res.json({ clientToken: result.accessToken });
      
    } catch (error: any) {
      console.error('Error setting up PayPal:', error);
      res.status(500).json({ error: 'Failed to setup PayPal: ' + error.message });
    }
  }

  async createPaypalOrder(req: Request, res: Response): Promise<void> {
    try {
      console.log('🏦 Creating PayPal order');
      
      const { amount, currency, intent } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
        return;
      }

      if (!currency) {
        res.status(400).json({ error: 'Invalid currency. Currency is required.' });
        return;
      }

      if (!intent) {
        res.status(400).json({ error: 'Invalid intent. Intent is required.' });
        return;
      }

      const collect = {
        body: {
          intent: intent,
          purchaseUnits: [{
            amount: {
              currencyCode: currency,
              value: amount,
            },
          }],
        },
        prefer: 'return=minimal',
      };

      const { body, ...httpResponse } = await this.ordersController.createOrder(collect);
      const jsonResponse = JSON.parse(String(body));
      
      console.log(`✅ PayPal order created: ${jsonResponse.id}`);
      
      res.status(httpResponse.statusCode).json(jsonResponse);
      
    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      res.status(500).json({ error: 'Failed to create order.' });
    }
  }

  async capturePaypalOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderID } = req.params;
      
      console.log(`🏦 Capturing PayPal order: ${orderID}`);
      
      const collect = {
        id: orderID,
        prefer: 'return=minimal',
      };

      const { body, ...httpResponse } = await this.ordersController.captureOrder(collect);
      const jsonResponse = JSON.parse(String(body));
      
      console.log(`✅ PayPal order captured: ${orderID}`);
      
      res.status(httpResponse.statusCode).json(jsonResponse);
      
    } catch (error: any) {
      console.error('Error capturing PayPal order:', error);
      res.status(500).json({ error: 'Failed to capture order.' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}