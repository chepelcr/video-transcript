import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Icons } from '@/components/ui/icons';
// import { ThemeToggle } from '@/components/ThemeToggle';
// import { LanguageToggle } from '@/components/LanguageToggle';
import { SiYoutube, SiVimeo } from 'react-icons/si';


interface Transcription {
  id: string;
  videoUrl: string;
  videoTitle?: string;
  transcript: string;
  status: string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
  createdAt: string;
}

interface TranscriptionHistoryResponse {
  transcriptions: Transcription[];
  total: number;
  page: number;
  limit: number;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previousTranscriptions, setPreviousTranscriptions] = useState<Transcription[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Calculate limit status early
  const dailyUsage = user?.transcriptionsUsed || 0;
  const dailyLimit = 3;
  const isLimitReached = dailyUsage >= dailyLimit;

  // Helper function to get video title with fallback
  const getVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      if (urlObj.hostname.includes('vimeo.com')) {
        return 'Vimeo Video';
      }
      return urlObj.hostname;
    } catch {
      return 'Video';
    }
  };

  const getVideoProviderIcon = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return <SiYoutube className="h-4 w-4 text-red-600 flex-shrink-0" />;
      }
      if (urlObj.hostname.includes('vimeo.com')) {
        return <SiVimeo className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      }
      return <Icons.fileText className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    } catch {
      return <Icons.fileText className="h-4 w-4 text-gray-500 flex-shrink-0" />;
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/${language}/login`);
    }
  }, [isAuthenticated, authLoading, navigate, language]);

  const {
    data: transcriptionData,
    isLoading: transcriptionsLoading,
    isFetching,
    refetch: refetchTranscriptions,
  } = useQuery<TranscriptionHistoryResponse>({
    queryKey: ['/api/users/transcriptions'],
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error && error.message && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    refetchInterval: (data: any) => {
      // Auto-refresh every 5 seconds if there are processing transcriptions
      const hasProcessing = data?.transcriptions?.some((t: Transcription) => t.status === 'processing' || t.status === 'pending');
      return hasProcessing ? 5000 : 10000; // Poll every 10 seconds for demonstration
    },
  });

  // Monitor for status changes and show notifications
  useEffect(() => {
    if (!transcriptionData?.transcriptions) return;

    const currentTranscriptions = transcriptionData.transcriptions;
    
    // If we have previous transcriptions, check for status changes
    if (previousTranscriptions.length > 0) {
      currentTranscriptions.forEach(current => {
        const previous = previousTranscriptions.find(p => p.id === current.id);
        
        if (previous && previous.status !== current.status) {
          console.log(`Status change detected: ${current.id} changed from ${previous.status} to ${current.status}`);
          
          // Status changed - show notification
          if (current.status === 'completed') {
            toast({
              title: t('notifications.completed.title'),
              description: t('notifications.completed.description').replace('{{title}}', current.videoTitle || getVideoTitle(current.videoUrl)),
              variant: 'default',
            });
          } else if (current.status === 'failed') {
            toast({
              title: t('notifications.failed.title'),
              description: t('notifications.failed.description').replace('{{title}}', current.videoTitle || getVideoTitle(current.videoUrl)),
              variant: 'destructive',
            });
          } else if (current.status === 'processing') {
            toast({
              title: t('notifications.processing.title'),
              description: t('notifications.processing.description').replace('{{title}}', current.videoTitle || getVideoTitle(current.videoUrl)),
            });
          }
        }
      });
    }
    
    // Update previous transcriptions for next comparison
    setPreviousTranscriptions(currentTranscriptions);
  }, [transcriptionData?.transcriptions, previousTranscriptions, toast, t, getVideoTitle]);

  const handleLogout = async () => {
    await logout();
    navigate(`/${language}/`);
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      toast({
        title: t('messages.error'),
        description: t('messages.enterUrl'),
        variant: 'destructive',
      });
      return;
    }

    if (isLimitReached && !user?.isPro) {
      toast({
        title: t('messages.error'),
        description: t('messages.limitReached'),
        variant: 'destructive',
      });
      return;
    }

    setIsTranscribing(true);
    
    try {
      // Create transcription record and queue for processing
      const createResponse = await apiRequest('POST', '/api/transcriptions/create', {
        videoUrl: videoUrl.trim(),
      });

      const responseData = await createResponse.json();

      toast({
        title: t('transcription.queued.title'),
        description: t('transcription.queued.description').replace('{{title}}', responseData.videoTitle || videoUrl.trim()),
      });

      // Clear form and refresh data
      setVideoUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/users/transcriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

    } catch (error: any) {
      console.error('Transcription creation error:', error);
      toast({
        title: t('transcription.error.title'),
        description: error.message || t('transcription.error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs">{t('status.completed')}</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white text-xs">{t('status.processing')}</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">{t('status.failed')}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white text-xs">{t('status.pending')}</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const transcriptions = transcriptionData?.transcriptions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile/Tablet Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-primary">VideoScript</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              {/* <ThemeToggle />
              <LanguageToggle /> */}
              <Button variant="outline" size="sm" onClick={() => navigate(`/${language}/profile`)}>
                {t('profile.editProfile')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/${language}/`)}>
                {t('common.backToHome')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('common.logout')}
              </Button>
            </div>

            {/* Mobile/Tablet Navigation */}
            <div className="lg:hidden flex items-center gap-1">
              {/* <ThemeToggle />
              <LanguageToggle /> */}
              <Button variant="outline" size="sm" onClick={() => navigate(`/${language}/profile`)}>
                <Icons.user className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/${language}/`)}>
                <Icons.home className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <Icons.logout className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcomeBack').replace('{{name}}', user?.username || '')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.description')}
          </p>
        </div>

        {/* New Transcription Form */}
        <Card className="mb-6 md:mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.fileText className="h-5 w-5" />
              {t('transcription.newTranscription')}
            </CardTitle>
            <CardDescription>
              {t('transcription.enterVideoUrl')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLimitReached && (
              <Alert className="mb-4">
                <AlertDescription>
                  {t('dashboard.dailyLimitReached')}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleTranscribe} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">{t('transcription.videoUrl')}</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder={t('transcription.videoUrlPlaceholder')}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={isTranscribing || isLimitReached}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.dailyUsage')}: {dailyUsage} / {user?.isPro ? '∞' : dailyLimit}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!videoUrl.trim() || isTranscribing || isLimitReached}
                    className="flex-1 sm:flex-none"
                  >
                    {isTranscribing ? (
                      <>
                        <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                        {t('transcription.processing')}
                      </>
                    ) : (
                      t('hero.transcribe')
                    )}
                  </Button>
                  

                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 md:grid-rows-1">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.user className="h-5 w-5" />
                  {t('dashboard.accountOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.plan')}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {t('dashboard.free')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.dailyUsage')}</p>
                  <p className="text-lg font-semibold">
                    {dailyUsage} / {dailyLimit}
                  </p>
                  {isLimitReached && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('dashboard.dailyLimitReached')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalTranscriptions')}</p>
                  <p className="text-lg font-semibold">{transcriptions.length}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.memberSince')}</p>
                  <p className="text-sm">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcription History */}
          <div className="md:col-span-2 lg:col-span-2">
            <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.fileText className="h-5 w-5" />
                    {t('history.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('history.empty.description')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchTranscriptions()}
                    disabled={transcriptionsLoading || isFetching}
                  >
                    <Icons.refresh className="h-4 w-4 mr-1" />
                    {t('common.refresh')}
                  </Button>
                  {(transcriptionsLoading || isFetching) && (
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transcriptionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                  </div>
                ) : transcriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Icons.fileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('history.empty')}
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate(`/${language}/`)}
                    >
                      {t('hero.transcribe')}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {transcriptions.map((transcription, index) => (
                        <div key={transcription.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                          {/* Video Title Row */}
                          <div className="flex items-center gap-2 min-w-0 mb-3">
                            {getVideoProviderIcon(transcription.videoUrl)}
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                              {transcription.videoTitle || getVideoTitle(transcription.videoUrl)}
                            </h4>
                          </div>

                          {/* Duration and Word Count Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {transcription.duration && (
                              <div className="flex items-center gap-1">
                                <Icons.clock className="h-3 w-3" />
                                {transcription.duration}s
                              </div>
                            )}
                            {transcription.status === 'completed' && transcription.wordCount && (
                              <div className="flex items-center gap-1">
                                <Icons.barChart className="h-3 w-3" />
                                {transcription.wordCount} {t('history.words')}
                              </div>
                            )}
                          </div>

                          {/* Transcript Preview or Status */}
                          {transcription.status === 'completed' && transcription.transcript && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                              {transcription.transcript}
                            </p>
                          )}
                          {transcription.status === 'processing' && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 italic mb-3">
                              Your transcription is being processed. This may take a few minutes...
                            </p>
                          )}
                          {transcription.status === 'failed' && (
                            <p className="text-sm text-red-600 dark:text-red-400 italic mb-3">
                              Transcription failed. Please try again with a different video.
                            </p>
                          )}

                          {/* Status Badge and Action Buttons Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1 flex-wrap">
                              {getStatusBadge(transcription.status)}
                              {transcription.status === 'completed' && transcription.accuracy && (
                                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                  {Math.round(transcription.accuracy)}%
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (transcription.transcript) {
                                    navigator.clipboard.writeText(transcription.transcript);
                                    toast({
                                      title: t('messages.success'),
                                      description: t('history.copied'),
                                    });
                                  }
                                }}
                                disabled={transcription.status !== 'completed' || !transcription.transcript}
                                className="h-8 w-8 p-0"
                                title={transcription.status === 'completed' ? "Copy transcript" : "Transcript not ready"}
                              >
                                <Icons.copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (transcription.transcript) {
                                    const blob = new Blob([transcription.transcript], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `transcription-${transcription.videoTitle || transcription.id}.txt`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                                disabled={transcription.status !== 'completed' || !transcription.transcript}
                                className="h-8 w-8 p-0"
                                title={transcription.status === 'completed' ? "Download transcript" : "Transcript not ready"}
                              >
                                <Icons.download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}