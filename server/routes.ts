import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuthRoutes } from "./auth-routes";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { transcriptionService } from "./transcription-service";
import { insertTranscriptionSchema } from "@shared/schema";
import { authenticateToken } from "./auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });
  // Setup authentication routes
  setupAuthRoutes(app);
  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const { email, planType } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Create or retrieve customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: email,
        });
      }

      // Create subscription - use a hardcoded test price for development
      // For production, you would set STRIPE_PRO_PRICE_ID in environment variables
      let priceId = process.env.STRIPE_PRO_PRICE_ID;
      
      // If no price ID is set, create a test price on the fly
      if (!priceId) {
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: 1900, // $19.00
          recurring: { interval: 'month' },
          product_data: {
            name: 'VideoScript Pro',
          },
        });
        priceId = price.id;
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Transcription routes
  app.post("/api/transcriptions/create", authenticateToken, async (req, res) => {
    try {
      const { videoUrl } = req.body;
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!videoUrl) {
        return res.status(400).json({ error: "Video URL is required" });
      }

      // Get user and check limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has reached daily limit (3 transcriptions for free users)
      if (user.subscriptionTier === "free" && (user.transcriptionsUsed || 0) >= 3) {
        return res.status(403).json({ 
          error: "Daily transcription limit reached. Upgrade to Pro for unlimited transcriptions." 
        });
      }

      // Validate URL and extract video info
      const videoInfo = await transcriptionService.validateAndExtractVideoInfo(videoUrl);
      
      if (!videoInfo.isValid) {
        return res.status(400).json({ error: "Invalid video URL" });
      }

      // Create transcription record
      const transcription = await storage.createTranscription({
        userId,
        videoUrl,
        videoTitle: videoInfo.title,
      });

      res.json({ 
        id: transcription.id,
        videoTitle: videoInfo.title,
        status: transcription.status
      });

    } catch (error) {
      console.error("Error creating transcription:", error);
      res.status(500).json({ error: "Failed to create transcription" });
    }
  });

  app.post("/api/transcriptions/:id/process", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get transcription
      const transcription = await storage.getTranscription(id);
      if (!transcription) {
        return res.status(404).json({ error: "Transcription not found" });
      }

      if (transcription.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (transcription.status !== "processing") {
        return res.status(400).json({ error: "Transcription is not in processing state" });
      }

      // Process transcription
      try {
        const result = await transcriptionService.transcribeVideo(transcription.videoUrl);
        
        // Update transcription with results
        const updatedTranscription = await storage.updateTranscription(id, {
          transcript: result.transcript,
          duration: result.duration.toString(),
          wordCount: result.wordCount,
          processingTime: result.processingTime.toString(),
          accuracy: result.accuracy.toString(),
          status: "completed",
        });

        // Increment user's transcription count
        await storage.incrementUserTranscriptions(userId);

        res.json(updatedTranscription);

      } catch (transcriptionError) {
        console.error("Transcription processing error:", transcriptionError);
        
        // Mark transcription as failed
        await storage.updateTranscription(id, {
          status: "failed",
        });

        res.status(500).json({ error: "Transcription processing failed" });
      }

    } catch (error) {
      console.error("Error processing transcription:", error);
      res.status(500).json({ error: "Failed to process transcription" });
    }
  });

  // Get user's transcriptions
  app.get("/api/users/transcriptions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const transcriptions = await storage.getTranscriptionsByUserId(userId);
      
      res.json({
        transcriptions,
        total: transcriptions.length,
        page: 1,
        limit: 50,
      });

    } catch (error) {
      console.error("Error fetching transcriptions:", error);
      res.status(500).json({ error: "Failed to fetch transcriptions" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
