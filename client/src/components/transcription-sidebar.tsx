import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Download, Copy, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

  const { data: transcriptionData, isLoading } = useQuery({
    queryKey: ['/api/users/transcriptions'],
    enabled: isAuthenticated,
    retry: false,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Transcriptions
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {!isAuthenticated ? (
              <div className="flex h-full items-center justify-center p-6">
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
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : transcriptions.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
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
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {transcriptions.map((transcription: Transcription) => (
                    <Card key={transcription.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                              {getVideoTitle(transcription.videoUrl)}
                            </CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(transcription.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {transcription.accuracy}%
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(transcription.duration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {transcription.wordCount} words
                          </div>
                        </div>

                        {/* Transcript preview */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                          {transcription.transcript.substring(0, 150)}...
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyTranscript(transcription.transcript)}
                            className="flex-1"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadTranscript(transcription)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer Stats for authenticated users */}
          {isAuthenticated && (
            <div className="border-t p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total transcriptions:</span>
                  <span className="font-medium">{transcriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Today's usage:</span>
                  <span className="font-medium">
                    {user?.transcriptionsUsed || 0} / {user?.isPro ? '∞' : '3'}
                  </span>
                </div>
                {!user?.isPro && (
                  <div className="pt-2">
                    <Button className="w-full" size="sm" disabled>
                      Upgrade to Pro - Coming Soon
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}