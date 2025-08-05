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
import { useEffect } from "react";

// Log component initialization
console.log('📦 App components loaded');

function RouterWithLanguage() {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    try {
      // Handle GitHub Pages query parameter redirect  
      const urlParams = new URLSearchParams(window.location.search);
      const pathFromQuery = urlParams.get('p');
      if (pathFromQuery) {
        const decodedPath = decodeURIComponent(pathFromQuery);
        setLocation(decodedPath);
        // Clean URL by preserving the base path and adding the decoded path
        const basePath = window.location.pathname.includes('/video-transcript') ? '/video-transcript' : '';
        const newUrl = basePath + decodedPath;
        window.history.replaceState({}, '', newUrl);
        console.log('GitHub Pages redirect handled:', decodedPath, '->', newUrl);
        return;
      }

      // Prevent infinite redirect loops
      if (location.includes('/es/es') || location.includes('/en/en')) {
        console.warn('Detected duplicate language prefix, fixing...');
        const cleanPath = location.replace(/^\/(en|es)\/(en|es)/, '/$2');
        setLocation(cleanPath);
        return;
      }

      // Check if URL starts with language prefix
      const pathMatch = location.match(/^\/(en|es)(\/.*|$)/);
      if (pathMatch) {
        const urlLang = pathMatch[1] as 'en' | 'es';
        if (urlLang !== language) {
          console.log(`Setting language to ${urlLang} from URL`);
          setLanguage(urlLang);
        }
      } else if (language === 'es' && !location.startsWith('/es') && location === '/') {
        // Only redirect root path to Spanish, avoid other paths
        console.log(`Redirecting root to Spanish: /es`);
        setLocation('/es');
      }
      
      // Handle GitHub Pages deployment - prevent URL rewriting
      const isGitHubPages = window.location.hostname.includes('github.io') || 
                           window.location.pathname.includes('/video-transcript') ||
                           window.ghPagesDebug;
      
      if (isGitHubPages && language === 'es' && location === '/') {
        console.log('GitHub Pages: redirecting to Spanish without browser URL change');
        setLocation('/es');
        return;
      }
      
      if (isGitHubPages) {
        console.log('GitHub Pages detected - preserving base path routing');
        return;
      }
      
      // Log current routing state for debugging
      console.log('Routing state:', { location, language, windowPath: window.location.pathname });
    } catch (error) {
      console.error('Router error:', error);
    }
  }, [location, language, setLanguage, setLocation]);

  const stripLanguagePrefix = (path: string) => {
    return path.replace(/^\/(en|es)/, '') || '/';
  };

  const currentPath = stripLanguagePrefix(location);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/en" component={Home} />
      <Route path="/es" component={Home} />
      <Route path="/en/checkout" component={Checkout} />
      <Route path="/es/checkout" component={Checkout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/en/subscribe" component={Subscribe} />
      <Route path="/es/subscribe" component={Subscribe} />
      <Route path="/subscribe" component={Subscribe} />
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
