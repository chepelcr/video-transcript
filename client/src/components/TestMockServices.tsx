// Test component to verify all mock services are working
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TestMockServices() {
  const { toast } = useToast();

  const testTranscription = async () => {
    try {
      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: 'https://www.youtube.com/watch?v=test123',
          language: 'en'
        })
      });
      const result = await response.json();
      toast({
        title: "Transcription Test Successful",
        description: `Created transcription: ${result.id}`
      });
    } catch (error) {
      toast({
        title: "Transcription Test Failed",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  const testPayPal = async () => {
    try {
      const setupResponse = await fetch('/api/paypal/setup');
      const setup = await setupResponse.json();
      
      const orderResponse = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: '19.00', currency: 'USD', intent: 'CAPTURE' })
      });
      const order = await orderResponse.json();
      
      toast({
        title: "PayPal Test Successful",
        description: `Client token: ${setup.clientToken.substring(0, 20)}...`
      });
    } catch (error) {
      toast({
        title: "PayPal Test Failed",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  const testStripe = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 19 })
      });
      const result = await response.json();
      
      toast({
        title: "Stripe Test Successful",
        description: `Client secret: ${result.clientSecret.substring(0, 20)}...`
      });
    } catch (error) {
      toast({
        title: "Stripe Test Failed",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Mock Services Test Panel</CardTitle>
        <CardDescription>
          Test all mock API services to verify frontend-only functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={testTranscription} variant="outline">
            Test Transcription API
          </Button>
          <Button onClick={testPayPal} variant="outline">
            Test PayPal API
          </Button>
          <Button onClick={testStripe} variant="outline">
            Test Stripe API
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> All services are simulated with mock data for frontend testing.
            Check the console for detailed API interaction logs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}