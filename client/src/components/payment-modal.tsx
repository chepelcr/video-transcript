import { useState } from "react";
import { X, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PayPalButton from "./PayPalButton";
import { useLocation } from "wouter";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'pro';
}

export default function PaymentModal({ isOpen, onClose, planType }: PaymentModalProps) {
  const [, setLocation] = useLocation();

  const planDetails = {
    pro: {
      name: "Pro",
      price: "19.00",
      description: "Monthly subscription for unlimited transcriptions"
    }
  };

  const plan = planDetails[planType];

  const handleStripePayment = () => {
    setLocation('/subscribe');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose Payment Method
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name} Plan</h4>
            <p className="text-2xl font-bold text-primary">${plan.price}/month</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleStripePayment}
              className="w-full bg-primary text-white py-4 hover:bg-indigo-600 transition-colors flex items-center justify-center"
            >
              <div className="mr-3 text-xl font-bold">STRIPE</div>
              Pay with Stripe
            </Button>
            
            <div className="w-full bg-blue-600 text-white rounded-lg relative overflow-hidden cursor-pointer hover:bg-blue-700 transition-colors">
              <div className="flex items-center justify-between p-4 pointer-events-none">
                <div className="flex items-center">
                  <div className="mr-3 text-xl font-bold">PayPal</div>
                  <span className="text-sm">Pay with PayPal</span>
                </div>
                <div className="bg-yellow-400 px-3 py-1 rounded text-blue-900 font-bold text-sm">
                  PayPal
                </div>
              </div>
              <div className="absolute inset-0 opacity-0 pointer-events-auto">
                <PayPalButton 
                  amount={plan.price}
                  currency="USD"
                  intent="CAPTURE"
                />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <Lock className="mr-1 h-4 w-4" />
              Secured by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
