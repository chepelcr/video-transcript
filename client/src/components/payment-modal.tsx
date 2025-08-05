import { useState } from "react";
import { X, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PayPalButton from "./PayPalButton";
import { useLocation } from "wouter";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'pro' | 'enterprise';
}

export default function PaymentModal({ isOpen, onClose, planType }: PaymentModalProps) {
  const [, setLocation] = useLocation();

  const planDetails = {
    pro: {
      name: "Pro",
      price: "19.00",
      description: "Monthly subscription for unlimited transcriptions"
    },
    enterprise: {
      name: "Enterprise", 
      price: "99.00",
      description: "Custom enterprise solution"
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
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center justify-between">
            Choose Payment Method
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900">{plan.name} Plan</h4>
            <p className="text-2xl font-bold text-primary">${plan.price}/month</p>
            <p className="text-sm text-gray-600">{plan.description}</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleStripePayment}
              className="w-full bg-primary text-white py-4 hover:bg-indigo-600 transition-colors flex items-center justify-center"
            >
              <div className="mr-3 text-xl font-bold">STRIPE</div>
              Pay with Stripe
            </Button>
            
            <div className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
              <div className="mr-3 text-xl font-bold">PayPal</div>
              <PayPalButton 
                amount={plan.price}
                currency="USD"
                intent="CAPTURE"
              />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center">
              <Lock className="mr-1 h-4 w-4" />
              Secured by 256-bit SSL encryption
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
