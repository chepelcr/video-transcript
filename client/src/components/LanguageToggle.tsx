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
    
    // Update URL with language prefix
    const currentPath = location.replace(/^\/(en|es)/, '') || '/';
    const newPath = newLang === 'en' ? currentPath : `/es${currentPath}`;
    setLocation(newPath);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Language indicator */}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
        /{language}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 h-9 rounded-md">
            <Globe className="h-4 w-4" />
            <span className="sr-only">Toggle language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => switchLanguage('en')}
            className={language === 'en' ? 'bg-accent' : ''}
          >
            🇺🇸 English
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchLanguage('es')}
            className={language === 'es' ? 'bg-accent' : ''}
          >
            🇪🇸 Español
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}