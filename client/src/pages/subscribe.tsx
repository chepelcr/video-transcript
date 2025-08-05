import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, Check, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

import { STRIPE_PUBLIC_KEY } from "@/lib/config";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const SubscribeForm = ({ email }: { email: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionSucceeded, setSubscriptionSucceeded] = useState(false);
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();

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
        title: t('messages.paymentFailed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubscriptionSucceeded(true);
      toast({
        title: t('messages.subscriptionSuccess'),
        description: t('subscription.welcomePro'),
      });
    }

    setIsProcessing(false);
  };

  if (subscriptionSucceeded) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('subscription.welcomePro')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('subscription.activeDesc')}</p>
        <Button onClick={() => setLocation(language === 'es' ? '/es' : '/')} className="bg-primary text-white">
          {t('subscription.startTranscribing')}
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
            {t('subscription.processing')}
          </>
        ) : (
          t('subscription.subscribeNow')
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
  const { language, t } = useLanguage();

  const handleSetupSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: t('messages.error'),
        description: t('messages.emailRequired'),
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
        title: t('subscription.setupError'),
        description: error.message || t('subscription.setupErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            onClick={() => setLocation(language === 'es' ? '/es' : '/')} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('nav.back') || 'Back to Home'}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">{t('subscription.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Plan Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('subscription.planTitle')}</h3>
                  <p className="text-3xl font-bold text-primary">$19<span className="text-lg text-gray-600 dark:text-gray-400">{t('subscription.month')}</span></p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.unlimited')}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.duration')}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.accuracy')}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.formats')}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.priority')}</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.support')}</span>
                  </li>
                </ul>
              </div>

              <form onSubmit={handleSetupSubscription} className="space-y-6">
                <div>
                  <Label htmlFor="email">{t('form.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('form.emailPlaceholder')}
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
                      t('messages.settingUp')
                    </>
                  ) : (
                    t('form.continue')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('footer.noCommitments')}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('subscription.setupError')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('subscription.setupErrorDesc')}</p>
            <Button onClick={() => setIsSetupComplete(false)} className="mr-2">
              {t('subscription.tryAgain')}
            </Button>
            <Button onClick={() => setLocation(language === 'es' ? '/es' : '/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('nav.back') || 'Back to Home'}
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
            <CardTitle className="text-2xl font-bold text-center">{t('subscription.setupComplete')}</CardTitle>
            <div className="text-center">
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('subscription.planTitle')}</h3>
                <p className="text-3xl font-bold text-primary">$19{t('subscription.month')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.subscriptionFor')} {email}</p>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <Lock className="mr-2 h-4 w-4" />
            t('subscription.sslSecured')
          </p>
        </div>
      </div>
    </div>
  );
}
