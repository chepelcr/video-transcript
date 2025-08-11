import { useState, useEffect } from "react";
import { Play, Gift, Bolt, Target, Shield, Star, Download, Copy, Lock, Check, User, History, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import VideoTranscriptionForm from "@/components/video-transcription-form";
import TranscriptionResults from "@/components/transcription-results";
import PaymentModal from "@/components/payment-modal";
import TranscriptionSidebar from "@/components/transcription-sidebar";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmailVerificationGuard } from "@/hooks/useEmailVerification";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { transcribeVideo } from "@/lib/transcription-api";

interface Transcription {
  id: string;
  transcript: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
  videoUrl?: string;
}

export default function Home() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro'>('pro');
  const [transcriptionsUsed, setTranscriptionsUsed] = useLocalStorage('transcriptionsUsed', 0);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingVideoUrl, setPendingVideoUrl] = useLocalStorage('pendingVideoUrl', "");
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  // Check email verification if authenticated
  useEmailVerificationGuard();

  // Debug authentication state (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('Home page auth state:', { 
        isAuthenticated, 
        isLoading, 
        user: user ? { username: user.username, id: user.id } : null 
      });
    }
  }, [isAuthenticated, isLoading, user]);

  // Use server data if authenticated, otherwise fallback to localStorage
  const userTranscriptionsUsed = isAuthenticated ? (user?.transcriptionsUsed || 0) : transcriptionsUsed;
  const isProUser = isAuthenticated ? user?.isPro : false;
  const remainingTranscriptions = isProUser ? Infinity : Math.max(0, 3 - userTranscriptionsUsed);

  // Auto-transcribe pending video URL after login
  useEffect(() => {
    if (isAuthenticated && pendingVideoUrl && pendingVideoUrl.trim() && remainingTranscriptions > 0) {
      if (import.meta.env.DEV) {
        console.log('Auto-transcribing pending URL:', pendingVideoUrl);
      }
      
      // Auto-submit the pending URL for transcription via new SQS system
      const autoTranscribe = async () => {
        try {
          const createResponse = await apiRequest('POST', '/api/transcriptions/create', {
            videoUrl: pendingVideoUrl.trim(),
          }) as { videoTitle?: string };

          toast({
            title: t('transcription.queued.title'),
            description: t('transcription.queued.description').replace('{{title}}', createResponse.videoTitle || 'Video'),
          });

          setPendingVideoUrl(""); // Clear pending URL
          
          // Navigate to dashboard to see processing status
          navigate(`/${language}/dashboard`);
          
        } catch (error: any) {
          console.error('Auto-transcription error:', error);
          toast({
            title: t('messages.error'),
            description: error.message || t('messages.unknownError'),
            variant: 'destructive',
          });
          setPendingVideoUrl(""); // Clear pending URL even on error
        }
      };
      
      autoTranscribe();
    }
  }, [isAuthenticated, pendingVideoUrl, remainingTranscriptions, t, toast, navigate, language]);

  const handleTranscriptionComplete = async (transcription: Transcription) => {
    setCurrentTranscription(transcription);
    setShowResults(true);
    
    // Save transcription to database if authenticated
    if (isAuthenticated) {
      try {
        // Get tokens and make authenticated request
        const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
        if (tokens.accessToken) {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`
          };

          const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
          const response = await fetch(`${baseUrl}/api/transcriptions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              videoUrl: transcription.videoUrl || "Unknown URL",
              transcript: transcription.transcript,
              duration: Number(transcription.duration) || 0,
              wordCount: Number(transcription.wordCount) || 0,
              processingTime: Number(transcription.processingTime) || 0,
              accuracy: Number(transcription.accuracy) || 0,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
          
          console.log("Transcription saved to database successfully");
        } else {
          console.error("No access token found for saving transcription");
        }
      } catch (error) {
        console.error("Failed to save transcription to database:", error);
        // Don't show error to user as the transcription still works
      }
    } else {
      // Only update localStorage if not authenticated
      setTranscriptionsUsed(transcriptionsUsed + 1);
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
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">VideoScript</h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.features')}
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.pricing')}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium">
                {t('nav.contact')}
              </button>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  {t('nav.history')}
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/${language}/dashboard`)}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {user?.username}
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    {t('common.logout')}
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate(`/${language}/login`)}>
                  {t('nav.getStarted')}
                </Button>
              )}
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <div className="lg:hidden flex items-center space-x-2">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/${language}/dashboard`)}
                  className="flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  {user?.username}
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate(`/${language}/login`)}>
                  {t('nav.getStarted')}
                </Button>
              )}
              <ThemeToggle />
              <LanguageToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <div className="px-4 py-2 space-y-2">
              <button 
                onClick={() => {
                  scrollToSection('features');
                  setIsMobileMenuOpen(false);
                }} 
                className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                {t('nav.features')}
              </button>
              <button 
                onClick={() => {
                  scrollToSection('pricing');
                  setIsMobileMenuOpen(false);
                }} 
                className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                {t('nav.pricing')}
              </button>
              <button 
                onClick={() => {
                  scrollToSection('contact');
                  setIsMobileMenuOpen(false);
                }} 
                className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
              >
                {t('nav.contact')}
              </button>
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setIsMobileMenuOpen(false);
                    }} 
                    className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {t('nav.history')}
                  </button>
                  <button 
                    onClick={() => {
                      navigate(`/${language}/dashboard`);
                      setIsMobileMenuOpen(false);
                    }} 
                    className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {t('nav.profile')}
                  </button>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }} 
                    className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    navigate(`/${language}/login`);
                    setIsMobileMenuOpen(false);
                  }} 
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  {t('nav.getStarted')}
                </button>
              )}
            </div>
          </div>
        )}
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
              isAuthenticated={isAuthenticated}
              onLoginRequired={(videoUrl) => {
                console.log('Storing pending video URL for after login:', videoUrl);
                setPendingVideoUrl(videoUrl);
                navigate(`/${language}/login`);
              }}
              onNavigateToResults={() => navigate(`/${language}/dashboard`)}
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
                    <History className="text-secondary text-xl" />
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
                {isAuthenticated ? (
                  <Button className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 mt-auto" disabled>
                    {t('pricing.free.button')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full mt-auto" 
                    onClick={() => navigate(`/${language}/login`)}
                  >
                    Sign In
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro Tier - Coming Soon */}
            <Card className="pricing-card border-2 border-gray-300 dark:border-gray-600 relative bg-white dark:bg-gray-800 flex flex-col opacity-75">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gray-500 text-white">Coming Soon</Badge>
              </div>
              <CardContent className="p-8 flex-grow flex flex-col">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pricing.pro.title')}</h3>
                  <div className="text-4xl font-bold text-gray-500 dark:text-gray-400 mb-2">$15</div>
                  <p className="text-gray-600 dark:text-gray-300">{t('pricing.pro.subtitle')}</p>
                </div>
                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.unlimited')}</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.duration')}</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.accuracy')}</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.formats')}</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.priority')}</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <Lock className="text-gray-400 mr-3 h-5 w-5" />
                      <span className="text-gray-700 dark:text-gray-300">{t('pricing.pro.support')}</span>
                    </li>
                  </ul>
                </div>
                <Button className="w-full bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed mt-auto" disabled>
                  Coming Soon
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

      {isAuthenticated && (
        <TranscriptionSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
