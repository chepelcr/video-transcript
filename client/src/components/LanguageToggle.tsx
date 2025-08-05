import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();

  const switchLanguage = (newLang: 'en' | 'es') => {
    setLanguage(newLang);
    
    // Check if we're in GitHub Pages environment
    const isGitHubPages = window.location.pathname.includes('/video-transcript') || (window as any).ghPagesDebug;
    
    if (isGitHubPages) {
      // For GitHub Pages, handle language routes properly
      const basePath = '/video-transcript';
      
      // First strip the base path from location if it exists
      let cleanLocation = location;
      if (cleanLocation.startsWith('/video-transcript')) {
        cleanLocation = cleanLocation.replace('/video-transcript', '') || '/';
      }
      
      // Then strip any language prefix
      const currentPath = cleanLocation.replace(/^\/(en|es)/, '') || '/';
      const newPath = currentPath === '/' ? `/${newLang}` : `/${newLang}${currentPath}`;
      const fullPath = `${basePath}${newPath}`;
      
      console.log('Language change in GitHub Pages:', { 
        newLang, 
        originalLocation: location,
        cleanLocation,
        currentPath, 
        newPath, 
        fullPath,
        windowPath: window.location.pathname
      });
      
      // Update both router state and browser URL
      setLocation(newPath);
      window.history.pushState({}, '', fullPath);
    } else {
      // Development environment - normal routing with both /en and /es
      const currentPath = location.replace(/^\/(en|es)/, '') || '/';
      const newPath = currentPath === '/' ? `/${newLang}` : `/${newLang}${currentPath}`;
      setLocation(newPath);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-md flex items-center justify-center">
          <span className="text-base">
            {language === 'es' ? '🇪🇸' : '🇺🇸'}
          </span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        <DropdownMenuItem
          onClick={() => switchLanguage('en')}
          className={`flex items-center justify-between ${language === 'en' ? 'bg-accent' : ''}`}
        >
          <span>English</span>
          <span className="ml-2">🇺🇸</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage('es')}
          className={`flex items-center justify-between ${language === 'es' ? 'bg-accent' : ''}`}
        >
          <span>Español</span>
          <span className="ml-2">🇪🇸</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}