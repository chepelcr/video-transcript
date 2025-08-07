import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import { DebugInfo } from "@/components/DebugInfo";
import React, { useEffect, useState } from "react";

// Log component initialization
console.log('📦 App components loaded');

function RouterWithLanguage() {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      console.log('Router effect triggered:', { location, language, windowPath: window.location.pathname });
      
      // Extract the route part for language detection
      let routePart = location;
      
      // Simple language routing - check URL for language prefix
      const pathMatch = routePart.match(/^\/(en|es)(\/.*|$)/);
      if (pathMatch) {
        const urlLang = pathMatch[1] as 'en' | 'es';
        if (urlLang !== language) {
          console.log(`Setting language to ${urlLang} from URL`);
          setLanguage(urlLang);
        }
      } else if (routePart === '/') {
        // Redirect root to default language
        const newPath = `/${language}`;
        console.log(`Redirecting root to: ${newPath}`);
        setLocation(newPath);
      }
      
      // Mark as initialized after processing
      if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Router error:', error);
    }
  }, [location, language, setLanguage, setLocation, isInitialized]);

  const stripLanguagePrefix = (path: string) => {
    // First remove base path if present, then remove language prefix
    let cleanPath = path;
    if (cleanPath.startsWith('/video-transcript')) {
      cleanPath = cleanPath.replace('/video-transcript', '') || '/';
    }
    return cleanPath.replace(/^\/(en|es)/, '') || '/';
  };

  // Get current path without base path and language prefix for routing
  const currentPath = stripLanguagePrefix(location);

  // Debug current routing state
  console.log('Router rendering with:', { location, currentPath, language, isInitialized });
  
  // Show loading state until initialized
  React.useEffect(() => {
    if (!isInitialized) {
      const timer = setTimeout(() => setIsInitialized(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  // Use the current location for routing
  const routePath = location;
  
  // Debug routing decision
  console.log('Switch routing with:', { routePath, location, currentPath });
  
  return (
    <Switch location={currentPath}>
      <Route path="/" component={Home} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  console.log('🔗 Router initializing...');
  return (
    <LanguageProvider>
      <RouterWithLanguage />
    </LanguageProvider>
  );
}

function App() {
  console.log('🏠 App component rendering...');
  
  // Show debug info when debug=true is in URL (for GitHub Pages debugging)
  const showDebug = window.location.search.includes('debug=true');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {showDebug && <DebugInfo />}
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
