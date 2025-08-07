import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Download, Copy, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface Transcription {
  id: string;
  videoUrl: string;
  transcript: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
  createdAt: string;
}

interface TranscriptionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TranscriptionSidebar({ isOpen, onClose }: TranscriptionSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Check if we're on a large screen (desktop) - must be declared before early return
  const [isDesktop, setIsDesktop] = useState(false);

  // Use effect to determine screen size - must be declared before early return
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Refresh transcriptions when sidebar opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refetch();
    }
  }, [isOpen, isAuthenticated, refetch]);

  const { data: transcriptionData, isLoading, refetch } = useQuery({
    queryKey: ['/api/users/transcriptions'],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const tokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
      if (!tokens.accessToken) {
        throw new Error('No access token available');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/users/transcriptions`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transcriptions: ${response.status}`);
      }

      return response.json();
    },
  });

  const transcriptions = (transcriptionData as any)?.transcriptions || [];

  const handleCopyTranscript = async (transcript: string) => {
    try {
      await navigator.clipboard.writeText(transcript);
      toast({
        title: t('messages.copied'),
        description: 'Transcription copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: t('messages.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTranscript = (transcription: Transcription) => {
    const blob = new Blob([transcription.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: t('messages.downloadStarted'),
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      return urlObj.hostname;
    } catch {
      return 'Video';
    }
  };

  const transcriptionContent = (
    <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
      {!isAuthenticated ? (
        <div className="flex h-full items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sign in to view history
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an account to track your transcriptions and access them anytime.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : transcriptions.length === 0 ? (
        <div className="flex h-full items-center justify-center p-6 bg-white dark:bg-gray-900">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No transcriptions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your transcription history will appear here after you create your first transcription.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-full bg-white dark:bg-gray-900">
          <div className="space-y-4 p-4 bg-white dark:bg-gray-900">
            {transcriptions.map((transcription: Transcription) => (
              <Card key={transcription.id} className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {getVideoTitle(transcription.videoUrl)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(transcription.accuracy)}% accurate
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(transcription.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {transcription.wordCount} words
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {transcription.transcript}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(transcription.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTranscript(transcription.transcript)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadTranscript(transcription)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  // Always render the container to ensure smooth animations
  // if (!isOpen) return null;

  return (
    <>
      {/* Mobile/Tablet Modal - Only render on smaller screens */}
      {!isDesktop && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-xs sm:max-w-md md:max-w-lg mx-auto h-[85vh] sm:h-[80vh] flex flex-col p-0 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-8 duration-500 ease-out">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                Recent Transcriptions
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage your transcription history
              </DialogDescription>
            </DialogHeader>
            {transcriptionContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Sidebar - Always render container for smooth animations */}
      {isDesktop && (
        <div className={`fixed inset-0 z-50 flex transition-all duration-500 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ease-out ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`} 
            onClick={onClose} 
          />
          
          {/* Sidebar */}
          <div className={`relative ml-auto w-full max-w-lg xl:max-w-xl bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 transform transition-all duration-500 ease-out ${
            isOpen 
              ? 'translate-x-0 scale-100 opacity-100' 
              : 'translate-x-full scale-95 opacity-50'
          }`}>
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Transcriptions
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              {transcriptionContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}