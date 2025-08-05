import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, Check } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ email }: { email: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionSucceeded, setSubscriptionSucceeded] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?subscription=success`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubscriptionSucceeded(true);
      toast({
        title: "Subscription Successful",
        description: "Welcome to VideoScript Pro!",
      });
    }

    setIsProcessing(false);
  };

  if (subscriptionSucceeded) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Pro!</h2>
        <p className="text-gray-600 mb-6">Your subscription is now active. Enjoy unlimited transcriptions and premium features.</p>
        <Button onClick={() => setLocation('/')} className="bg-primary text-white">
          Start Transcribing
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-primary text-white hover:bg-indigo-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSetupSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/create-subscription", { 
        email, 
        planType: 'pro' 
      });
      const data = await response.json();
      
      setClientSecret(data.clientSecret);
      setIsSetupComplete(true);
    } catch (error: any) {
      toast({
        title: "Setup Error",
        description: error.message || "Failed to setup subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            onClick={() => setLocation('/')} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Subscribe to VideoScript Pro</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Plan Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
                  <p className="text-3xl font-bold text-primary">$19<span className="text-lg text-gray-600">/month</span></p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Unlimited transcriptions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Up to 2 hours per video</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Premium accuracy (99%)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Multiple formats (TXT, SRT, VTT)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Email support</span>
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSetupSubscription} className="space-y-6">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary text-white hover:bg-indigo-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Cancel anytime. No long-term commitments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Setup Error</h2>
            <p className="text-gray-600 mb-6">Unable to setup subscription. Please try again.</p>
            <Button onClick={() => setIsSetupComplete(false)} className="mr-2">
              Try Again
            </Button>
            <Button onClick={() => setLocation('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          onClick={() => setIsSetupComplete(false)} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Complete Your Subscription</CardTitle>
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900">Pro Plan</h3>
                <p className="text-3xl font-bold text-primary">$19/month</p>
                <p className="text-sm text-gray-600">Subscription for {email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm email={email} />
            </Elements>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <i className="fas fa-lock mr-1"></i>
            Secured by 256-bit SSL encryption
          </p>
        </div>
      </div>
    </div>
  );
}
