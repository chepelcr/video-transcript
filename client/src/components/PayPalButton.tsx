// Mock PayPal Button for frontend-only testing
import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
    try {
      toast({
        title: "Processing PayPal Payment...",
        description: "Simulating PayPal checkout process"
      });

      // Simulate PayPal payment flow
      console.log("Mock PayPal: Creating order for", { amount, currency, intent });
      
      // Create order
      const orderResponse = await fetch('/api/paypal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, intent })
      });
      const order = await orderResponse.json();
      
      // Simulate user approval (in real PayPal, this would open popup)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Capture payment
      const captureResponse = await fetch(`/api/paypal/order/${order.id}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await captureResponse.json();
      
      console.log("Mock PayPal: Payment completed", result);
      
      toast({
        title: "Payment Successful!",
        description: `Mock PayPal payment of ${currency} ${amount} completed successfully`
      });
      
      // Refresh the page to show updated subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Mock PayPal payment failed:", error);
      toast({
        title: "Payment Failed",
        description: "Mock PayPal payment could not be processed",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handlePayPalPayment}
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.18-.253c-.333-.367-.818-.543-1.544-.543H13.97c-.524 0-.968.382-1.05.9L11.94 12.9c-.082.518.285.94.808.94h2.462c1.73 0 3.032-.543 3.888-1.81.732-1.08.866-2.41.563-4.113z"/>
      </svg>
      Pay with PayPal (Mock)
    </Button>
  );
}