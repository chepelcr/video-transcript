import { Request, Response } from 'express';
import Stripe from 'stripe';
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { AuthRequest } from '../types/auth.types';
import { IUserRepository } from '../repositories/user.repository';

export interface IPaymentController {
  // Stripe methods
  createPaymentIntent(req: AuthRequest, res: Response): Promise<void>;
  getOrCreateSubscription(req: AuthRequest, res: Response): Promise<void>;
  
  // PayPal methods
  getPaypalClientToken(req: Request, res: Response): Promise<void>;
  createPaypalOrder(req: Request, res: Response): Promise<void>;
  capturePaypalOrder(req: Request, res: Response): Promise<void>;
}

export class PaymentController implements IPaymentController {
  private stripe: Stripe;
  private paypalClient: Client;
  private ordersController: OrdersController;
  private oAuthController: OAuthAuthorizationController;

  constructor(private userRepository: IUserRepository) {
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
      throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
    }

    this.paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      timeout: 0,
      environment: process.env.NODE_ENV === "production" 
        ? Environment.Production 
        : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
      },
    });

    this.ordersController = new OrdersController(this.paypalClient);
    this.oAuthController = new OAuthAuthorizationController(this.paypalClient);
  }

  // Stripe Methods
  async createPaymentIntent(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`💳 Creating Stripe payment intent for user: ${req.userId?.substring(0, 8)}...`);
      
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
        return;
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.userId!
        }
      });

      console.log(`✅ Stripe payment intent created: ${paymentIntent.id}`);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
      
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ 
        error: "Error creating payment intent: " + error.message 
      });
    }
  }

  async getOrCreateSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📋 Getting/creating subscription for user: ${req.userId?.substring(0, 8)}...`);
      
      const user = await this.userRepository.findById(req.userId!);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        const subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
          const invoice = subscription.latest_invoice as any;
          if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
            res.json({
              subscriptionId: subscription.id,
              clientSecret: invoice.payment_intent.client_secret,
            });
            return;
          }
        }
      }

      if (!user.email) {
        res.status(400).json({ error: 'No user email on file' });
        return;
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
        await this.userRepository.updateStripeCustomerId(user.id, customerId);
      }

      // Create subscription
      if (!process.env.STRIPE_PRICE_ID) {
        res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' });
        return;
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await this.userRepository.updateUserStripeInfo(user.id, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;

      console.log(`✅ Stripe subscription created: ${subscription.id}`);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });

    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create subscription' 
      });
    }
  }

  // PayPal Methods
  async getPaypalClientToken(req: Request, res: Response): Promise<void> {
    try {
      console.log('🅿️ Generating PayPal client token...');
      
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
      ).toString("base64");

      const { result } = await this.oAuthController.requestToken(
        {
          authorization: `Basic ${auth}`,
        },
        { intent: "sdk_init", response_type: "client_token" },
      );

      console.log('✅ PayPal client token generated');
      
      res.json({
        clientToken: result.accessToken,
      });
      
    } catch (error: any) {
      console.error('PayPal token error:', error);
      res.status(500).json({ 
        error: 'Failed to generate PayPal token' 
      });
    }
  }

  async createPaypalOrder(req: Request, res: Response): Promise<void> {
    try {
      console.log('🅿️ Creating PayPal order...');
      
      const { amount, currency, intent } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        res.status(400).json({
          error: "Invalid amount. Amount must be a positive number.",
        });
        return;
      }

      if (!currency) {
        res.status(400).json({ 
          error: "Invalid currency. Currency is required." 
        });
        return;
      }

      if (!intent) {
        res.status(400).json({ 
          error: "Invalid intent. Intent is required." 
        });
        return;
      }

      const collect = {
        body: {
          intent: intent,
          purchaseUnits: [
            {
              amount: {
                currencyCode: currency,
                value: amount,
              },
            },
          ],
        },
        prefer: "return=minimal",
      };

      const { body, ...httpResponse } = await this.ordersController.createOrder(collect);
      const jsonResponse = JSON.parse(String(body));
      const httpStatusCode = httpResponse.statusCode;

      console.log(`✅ PayPal order created: ${jsonResponse.id}`);
      
      res.status(httpStatusCode).json(jsonResponse);
      
    } catch (error: any) {
      console.error("PayPal create order error:", error);
      res.status(500).json({ 
        error: "Failed to create order." 
      });
    }
  }

  async capturePaypalOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderID } = req.params;
      console.log(`🅿️ Capturing PayPal order: ${orderID}`);
      
      const collect = {
        id: orderID,
        prefer: "return=minimal",
      };

      const { body, ...httpResponse } = await this.ordersController.captureOrder(collect);
      const jsonResponse = JSON.parse(String(body));
      const httpStatusCode = httpResponse.statusCode;

      console.log(`✅ PayPal order captured: ${orderID}`);
      
      res.status(httpStatusCode).json(jsonResponse);
      
    } catch (error: any) {
      console.error("PayPal capture order error:", error);
      res.status(500).json({ 
        error: "Failed to capture order." 
      });
    }
  }
}