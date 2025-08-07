import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { authStorage } from "./auth-storage";
import { setupAuthRoutes } from "./auth-routes";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { transcriptionService } from "./transcription-service";
import { insertTranscriptionSchema } from "@shared/schema";
import { authenticateToken } from "./auth";
import { sqsService } from "./sqs-service";
import crypto from "crypto";

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
      const user = await authStorage.getUserById(userId);
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
        if (videoInfo.duration && videoInfo.duration > 300) {
          return res.status(400).json({ 
            error: "Video is too long. Please use videos that are 5 minutes or shorter.",
            code: "VIDEO_TOO_LONG",
            duration: Math.round(videoInfo.duration / 60 * 10) / 10 // Convert to minutes with 1 decimal
          });
        }
        return res.status(400).json({ error: "Invalid video URL" });
      }

      // Create transcription record with initial status
      console.log('Creating transcription with video info:', { 
        userId, 
        videoUrl, 
        videoTitle: videoInfo.title, 
        duration: videoInfo.duration,
        status: "processing" 
      });
      
      const transcription = await authStorage.createTranscription({
        userId,
        videoUrl,
        videoTitle: videoInfo.title,
        status: "processing",
        duration: videoInfo.duration || null,
      } as any);
      
      console.log('Transcription created:', transcription);

      // Queue transcription for asynchronous processing
      try {
        await sqsService.queueTranscription(transcription.id, videoUrl, userId);
        console.log(`Transcription ${transcription.id} queued successfully`);
      } catch (queueError) {
        console.error('Failed to queue transcription:', queueError);
        // Mark as failed if we can't queue it
        await authStorage.updateTranscription(transcription.id, {
          status: "failed",
        } as any);
        return res.status(500).json({ error: "Failed to queue transcription for processing" });
      }

      res.json({ 
        id: transcription.id,
        videoTitle: videoInfo.title,
        status: (transcription as any).status || "processing"
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
      const transcription = await authStorage.getTranscription(id);
      if (!transcription) {
        return res.status(404).json({ error: "Transcription not found" });
      }

      if (transcription.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if ((transcription as any).status !== "processing") {
        return res.status(400).json({ error: "Transcription is not in processing state" });
      }

      // Process transcription
      try {
        const result = await transcriptionService.transcribeVideo(transcription.videoUrl);
        
        // Update transcription with results
        const updatedTranscription = await authStorage.updateTranscription(id, {
          transcript: result.transcript,
          duration: result.duration || 0,
          wordCount: result.wordCount || 0,
          processingTime: result.processingTime || 0,
          accuracy: result.accuracy || 0,
          status: "completed",
        } as any);

        // Increment user's transcription count
        await authStorage.incrementUserTranscriptions(userId);

        res.json(updatedTranscription);

      } catch (transcriptionError) {
        console.error("Transcription processing error:", transcriptionError);
        
        // Mark transcription as failed
        await authStorage.updateTranscription(id, {
          status: "failed",
        } as any);

        // Pass through specific error messages from transcription service
        const errorMessage = (transcriptionError as Error).message;
        
        // Check if it's a specific user-facing error (like video too long)
        if (errorMessage === 'El video tiene una duración muy larga. Por favor, usa un video de máximo 3 minutos.') {
          res.status(400).json({ error: errorMessage });
        } else {
          // For other errors, provide a generic message but log the specific error
          res.status(500).json({ error: "Transcription processing failed" });
        }
      }

    } catch (error) {
      console.error("Error processing transcription:", error);
      res.status(500).json({ error: "Failed to process transcription" });
    }
  });

  // Webhook endpoint to receive processed transcriptions
  app.post("/api/transcriptions/webhook/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const signature = req.headers['x-webhook-signature'] as string;
      
      if (!signature) {
        console.error('Webhook signature missing');
        return res.status(401).json({ error: "Webhook signature required" });
      }

      const payload = JSON.stringify(req.body);
      
      // Verify webhook signature
      if (!sqsService.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const { success, transcript, duration, wordCount, processingTime, accuracy, error } = req.body;

      // Get transcription
      const transcription = await authStorage.getTranscription(id);
      if (!transcription) {
        console.error(`Transcription ${id} not found`);
        return res.status(404).json({ error: "Transcription not found" });
      }

      if (success) {
        // Update transcription with successful results
        const updatedTranscription = await authStorage.updateTranscription(id, {
          transcript: transcript || "",
          duration: duration || 0,
          wordCount: wordCount || 0,
          processingTime: processingTime || 0,
          accuracy: accuracy || 0,
          status: "completed",
        } as any);

        // Increment user's transcription count
        await authStorage.incrementUserTranscriptions(transcription.userId);

        console.log(`Transcription ${id} completed successfully`);
      } else {
        // Update transcription as failed
        await authStorage.updateTranscription(id, {
          status: "failed",
        } as any);

        console.log(`Transcription ${id} failed:`, error);
      }

      res.status(200).json({ message: "Webhook processed successfully" });

    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Get user's transcriptions
  app.get("/api/users/transcriptions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const result = await authStorage.getUserTranscriptions(userId, 50, 0);
      
      res.json({
        transcriptions: result.transcriptions,
        total: result.total,
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
