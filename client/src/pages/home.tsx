import { useState, useEffect } from "react";
import { Play, Gift, Bolt, Target, Shield, Star, Download, Copy, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VideoTranscriptionForm from "@/components/video-transcription-form";
import TranscriptionResults from "@/components/transcription-results";
import PaymentModal from "@/components/payment-modal";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [transcriptionsUsed, setTranscriptionsUsed] = useLocalStorage('transcriptionsUsed', 0);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const remainingTranscriptions = Math.max(0, 3 - transcriptionsUsed);

  const handleTranscriptionComplete = (transcription: Transcription) => {
    setCurrentTranscription(transcription);
    setShowResults(true);
    setTranscriptionsUsed(prev => prev + 1);
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUpgrade = (plan: 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">VideoScript</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Features
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Pricing
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-600 hover:text-primary px-3 py-2 text-sm font-medium">
                  Contact
                </button>
                <Button onClick={() => handleUpgrade('pro')} className="bg-primary text-white hover:bg-indigo-600">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Transform Videos to Text
              <span className="block text-indigo-200">in Seconds</span>
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Powerful AI-driven video transcription service. Upload any video URL and get accurate transcripts instantly. Perfect for content creators, students, and professionals.
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
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose VideoScript?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the fastest, most accurate video transcription service powered by advanced AI technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 feature-icon rounded-lg flex items-center justify-center mb-6">
                  <Bolt className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Lightning Fast</h3>
                <p className="text-gray-600">
                  Get your video transcriptions in seconds, not minutes. Our optimized AI processes videos up to 10x faster than competitors.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 accent-icon rounded-lg flex items-center justify-center mb-6">
                  <Target className="text-accent text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">99% Accuracy</h3>
                <p className="text-gray-600">
                  Industry-leading accuracy with support for multiple languages and accents. Perfect transcriptions every time.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 secondary-icon rounded-lg flex items-center justify-center mb-6">
                  <Shield className="text-secondary text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Private</h3>
                <p className="text-gray-600">
                  Your data is encrypted and never stored. We process your videos securely and delete them immediately after transcription.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <Card className="pricing-card">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                  <p className="text-gray-600">Perfect for trying out</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>3 transcriptions per month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Up to 10 minutes per video</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Basic accuracy</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Download as TXT</span>
                  </li>
                </ul>
                <Button className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="pricing-card border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$19</div>
                  <p className="text-gray-600">per month</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Unlimited transcriptions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Up to 2 hours per video</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Premium accuracy (99%)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Multiple formats (TXT, SRT, VTT)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button onClick={() => handleUpgrade('pro')} className="w-full bg-primary text-white hover:bg-indigo-600">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="pricing-card">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">Custom</div>
                  <p className="text-gray-600">For large teams</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>Custom API integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>White-label options</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>24/7 phone support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-3 h-5 w-5" />
                    <span>SLA guarantee</span>
                  </li>
                </ul>
                <Button onClick={() => handleUpgrade('enterprise')} className="w-full bg-secondary text-white hover:bg-violet-600">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Secure payment powered by</p>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Content Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied users who rely on VideoScript for their transcription needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="testimonial-card bg-gray-50">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 mb-6">
                  "VideoScript has revolutionized my content creation workflow. The accuracy is incredible and it saves me hours of manual transcription work every week."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">SJ</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah Johnson</div>
                    <div className="text-gray-600 text-sm">YouTube Creator</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="testimonial-card bg-gray-50">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 mb-6">
                  "As a student, VideoScript helps me convert lecture videos to text for better studying. The free tier is perfect for occasional use, and the accuracy is impressive."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mike Chen</div>
                    <div className="text-gray-600 text-sm">Graduate Student</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="testimonial-card bg-gray-50">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-800 mb-6">
                  "Our marketing team uses VideoScript to create captions for all our video content. The Pro plan handles our volume perfectly and the quality is consistently excellent."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">ER</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Emily Rodriguez</div>
                    <div className="text-gray-600 text-sm">Marketing Director</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">VideoScript</h3>
              <p className="text-gray-400 mb-6">
                The fastest, most accurate AI-powered video transcription service. Transform your videos into searchable, editable text in seconds.
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
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="text-gray-400 hover:text-white transition-colors">Pricing</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 VideoScript. All rights reserved. Made with ❤️ for content creators worldwide.
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
