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
      
      // Handle GitHub Pages query parameter redirect  
      const urlParams = new URLSearchParams(window.location.search);
      const pathFromQuery = urlParams.get('p');
      if (pathFromQuery) {
        const decodedPath = decodeURIComponent(pathFromQuery);
        console.log('Processing GitHub Pages redirect:', pathFromQuery, '->', decodedPath);
        setLocation(decodedPath);
        
        // Handle language detection from redirected path
        if (decodedPath.startsWith('/es')) {
          console.log('Setting language to Spanish from redirect:', decodedPath);
          setLanguage('es');
        } else if (decodedPath.startsWith('/en')) {
          console.log('Setting language to English from redirect:', decodedPath);
          setLanguage('en');
        }
        
        // Ensure the route is processed correctly
        console.log('GitHub Pages redirect processing complete:', {
          originalQuery: pathFromQuery,
          decodedPath,
          newLocation: decodedPath,
          languageSet: decodedPath.startsWith('/es') ? 'es' : decodedPath.startsWith('/en') ? 'en' : 'none'
        });
        
        // Clean URL by preserving the base path and adding the decoded path
        const basePath = window.location.pathname.includes('/video-transcript') ? '/video-transcript' : '';
        const newUrl = basePath + decodedPath;
        window.history.replaceState({}, '', newUrl);
        console.log('GitHub Pages redirect completed:', newUrl);
        
        // Ensure component re-renders with new route after redirect
        setTimeout(() => setIsInitialized(true), 0);
        return;
      }

      // Prevent infinite redirect loops
      if (location.includes('/es/es') || location.includes('/en/en')) {
        console.warn('Detected duplicate language prefix, fixing...');
        const cleanPath = location.replace(/^\/(en|es)\/(en|es)/, '/$2');
        setLocation(cleanPath);
        return;
      }

      // Check if URL starts with language prefix (after removing base path)
      const pathWithoutBase = location.replace('/video-transcript', '') || '/';
      const pathMatch = pathWithoutBase.match(/^\/(en|es)(\/.*|$)/);
      if (pathMatch) {
        const urlLang = pathMatch[1] as 'en' | 'es';
        if (urlLang !== language) {
          console.log(`Setting language to ${urlLang} from URL`);
          setLanguage(urlLang);
        }
      } else if (language === 'es' && !pathWithoutBase.startsWith('/es') && pathWithoutBase === '/') {
        // Only redirect root path to Spanish, avoid other paths
        console.log(`Redirecting root to Spanish: /es`);
        setLocation('/es');
      }
      
      // Handle GitHub Pages deployment - prevent URL rewriting
      const isGitHubPages = window.location.hostname.includes('github.io') || 
                           window.location.pathname.includes('/video-transcript') ||
                           (window as any).ghPagesDebug;
      
      // For GitHub Pages, handle both /en and /es routes properly
      if (isGitHubPages && location === '/' && !pathFromQuery) {
        console.log('GitHub Pages: Root access, redirecting to language-specific route');
        const langPath = `/${language}`;
        setLocation(langPath);
        // Always preserve the base path for GitHub Pages
        const fullPath = `/video-transcript${langPath}`;
        window.history.replaceState({}, '', fullPath);
        return;
      }
      
      if (isGitHubPages) {
        console.log('GitHub Pages detected - preserving base path routing');
        console.log('Current state:', { location, language, isGitHubPages, windowPath: window.location.pathname });
        return;
      }
      
      // Log current routing state for debugging
      console.log('Development routing state:', { location, language, windowPath: window.location.pathname });
      
      // Mark as initialized after processing
      if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Router error:', error);
    }
  }, [location, language, setLanguage, setLocation, isInitialized]);

  const stripBasePath = (path: string) => {
    // Remove GitHub Pages base path first
    if (path.startsWith('/video-transcript')) {
      path = path.replace('/video-transcript', '') || '/';
    }
    return path;
  };

  const stripLanguagePrefix = (path: string) => {
    return path.replace(/^\/(en|es)/, '') || '/';
  };

  // First strip base path, then language prefix
  const pathWithoutBase = stripBasePath(location);
  const currentPath = stripLanguagePrefix(pathWithoutBase);

  // Debug current routing state
  console.log('Router rendering with:', { location, pathWithoutBase, currentPath, language, isInitialized });
  
  // Show loading state until initialized, but only for a short time to prevent infinite loading
  if (!isInitialized) {
    // Auto-initialize after a brief moment to prevent stuck loading states
    setTimeout(() => setIsInitialized(true), 100);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  // Use the path without base for routing
  const routePath = pathWithoutBase;
  
  return (
    <Switch location={routePath}>
      <Route path="/" component={Home} />
      <Route path="/en" component={Home} />
      <Route path="/es" component={Home} />
      <Route path="/en/" component={Home} />
      <Route path="/es/" component={Home} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/en/checkout" component={Checkout} />
      <Route path="/es/checkout" component={Checkout} />
      <Route path="/en/checkout/" component={Checkout} />
      <Route path="/es/checkout/" component={Checkout} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/en/subscribe" component={Subscribe} />
      <Route path="/es/subscribe" component={Subscribe} />
      <Route path="/en/subscribe/" component={Subscribe} />
      <Route path="/es/subscribe/" component={Subscribe} />
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
