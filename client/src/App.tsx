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
        // Clean URL by removing the query parameter
        const newUrl = window.location.pathname.replace('/video-transcript', '') + decodedPath;
        window.history.replaceState({}, '', newUrl);
        return;
      }

      // Check if URL starts with language prefix
      const pathMatch = location.match(/^\/(en|es)(\/.*|$)/);
      if (pathMatch) {
        const urlLang = pathMatch[1] as 'en' | 'es';
        if (urlLang !== language) {
          setLanguage(urlLang);
        }
      } else if (language === 'es' && !location.startsWith('/es')) {
        // If Spanish is selected but URL doesn't have /es, redirect
        setLocation(`/es${location}`);
      }
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
