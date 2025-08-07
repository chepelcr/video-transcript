import { useState, useEffect } from "react";
import { Play, Gift, Bolt, Target, Shield, Star, Download, Copy, Lock, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import VideoTranscriptionForm from "@/components/video-transcription-form";
import TranscriptionResults from "@/components/transcription-results";
import PaymentModal from "@/components/payment-modal";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface Transcription {
  id: string;
  transcript: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
}

export default function Home() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro'>('pro');
  const [transcriptionsUsed, setTranscriptionsUsed] = useLocalStorage('transcriptionsUsed', 0);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // Use server data if authenticated, otherwise fallback to localStorage
  const userTranscriptionsUsed = isAuthenticated ? (user?.transcriptionsUsed || 0) : transcriptionsUsed;
  const isProUser = isAuthenticated ? user?.isPro : false;
  const remainingTranscriptions = isProUser ? Infinity : Math.max(0, 3 - userTranscriptionsUsed);

  const handleTranscriptionComplete = (transcription: Transcription) => {
    setCurrentTranscription(transcription);
    setShowResults(true);
    
    // Only update localStorage if not authenticated (server will handle authenticated users)
    if (!isAuthenticated) {
      setTranscriptionsUsed((prev: number) => prev + 1);
    }
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const handleUpgrade = (plan: 'pro') => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">VideoScript</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.features')}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.pricing')}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.contact')}
              </button>
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/${language}/dashboard`)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {user?.firstName}
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate(`/${language}/login`)}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate(`/${language}/register`)}>
                    {t('nav.getStarted')}
                  </Button>
                </>
              )}
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <div className="md:hidden flex items-center space-x-2">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/${language}/dashboard`)}
                  className="flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  {user?.firstName}
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate(`/${language}/register`)}>
                  {t('nav.getStarted')}
                </Button>
              )}
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('hero.title')}
              <span className="block text-indigo-200">{t('hero.subtitle')}</span>
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
            
            <VideoTranscriptionForm 
              onTranscriptionComplete={handleTranscriptionComplete}
              remainingTranscriptions={remainingTranscriptions}
              onUpgradeRequired={() => handleUpgrade('pro')}
            />
          </div>
        </div>
      </section>

      {/* Results Section */}
      {showResults && currentTranscription && (
        <TranscriptionResults transcription={currentTranscription} />
      )}

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow bg-white dark:bg-gray-700">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 feature-icon rounded-lg flex items-center justify-center mr-4">
                    <Bolt className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('features.fast.title')}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  {t('features.fast.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow bg-white dark:bg-gray-700">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 accent-icon rounded-lg flex items-center justify-center mr-4">
                    <Target className="text-accent text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('features.accurate.title')}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  {t('features.accurate.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow bg-white dark:bg-gray-700">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 secondary-icon rounded-lg flex items-center justify-center mr-4">
                    <Shield className="text-secondary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('features.secure.title')}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  {t('features.secure.desc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Card className="pricing-card bg-white dark:bg-gray-800 flex flex-col">
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pricing.free.title')}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$0</div>
                  <p className="text-gray-600 dark:text-gray-300">{t('pricing.free.subtitle')}</p>
                </div>
                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <Check className="text-accent mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.free.transcriptions')}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-accent mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.free.duration')}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-accent mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.free.accuracy')}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-accent mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.free.format')}</span>
                    </li>
                  </ul>
                </div>
                <Button className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 mt-auto" disabled>
                  {t('pricing.free.button')}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="pricing-card border-2 border-primary relative bg-white dark:bg-gray-800 flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">{t('pricing.pro.popular')}</Badge>
              </div>
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pricing.pro.title')}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">$15</div>
                  <p className="text-gray-600 dark:text-gray-300">{t('pricing.pro.subtitle')}</p>
                </div>
                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
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
                <Button onClick={() => handleUpgrade('pro')} className="w-full bg-primary text-white hover:bg-indigo-600 mt-auto">
                  {t('pricing.pro.button')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-4">{t('pricing.payment')}</p>
            <div className="flex justify-center items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-primary">STRIPE</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-blue-600">PayPal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="testimonial-card bg-gray-50 dark:bg-gray-700 flex flex-col">
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-6 flex-grow text-justify">
                  "{t('testimonials.sarah.text')}"
                </p>
                <div className="flex items-center mt-auto">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">SJ</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{t('testimonials.sarah.name')}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">{t('testimonials.sarah.role')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="testimonial-card bg-gray-50 dark:bg-gray-700 flex flex-col">
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-6 flex-grow text-justify">
                  "{t('testimonials.mike.text')}"
                </p>
                <div className="flex items-center mt-auto">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{t('testimonials.mike.name')}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">{t('testimonials.mike.role')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="testimonial-card bg-gray-50 dark:bg-gray-700 flex flex-col">
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-6 flex-grow text-justify">
                  "{t('testimonials.lisa.text')}"
                </p>
                <div className="flex items-center mt-auto">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">LR</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">{t('testimonials.lisa.name')}</div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">{t('testimonials.lisa.role')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">VideoScript</h3>
              <p className="text-gray-400 dark:text-gray-300 mb-6">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center">T</div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center">L</div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <div className="w-6 h-6 flex items-center justify-center">G</div>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition-colors">{t('nav.features')}</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="text-gray-400 hover:text-white transition-colors">{t('nav.pricing')}</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.apiDocs')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.status')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.helpCenter')}</a></li>
                <li><button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition-colors">{t('footer.contact')}</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.terms')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 dark:border-gray-600 mt-12 pt-8 text-center">
            <p className="text-gray-400 dark:text-gray-300">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        planType={selectedPlan}
      />
    </div>
  );
}
