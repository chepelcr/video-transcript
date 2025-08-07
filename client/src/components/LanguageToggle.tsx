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
    
    // Simple language routing for custom domain deployment
    // Remove any existing language prefix from current path
    const currentPath = location.replace(/^\/(en|es)/, '') || '/';
    const newPath = currentPath === '/' ? `/${newLang}` : `/${newLang}${currentPath}`;
    
    console.log('Language switch:', { 
      newLang, 
      originalLocation: location,
      currentPath, 
      newPath,
      windowPath: window.location.pathname
    });
    
    // Update router location
    setLocation(newPath);
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