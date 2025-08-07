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
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
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
        return <SiYoutube className="h-4 w-4 text-red-600" />;
      }
      if (urlObj.hostname.includes('vimeo.com')) {
        return <SiVimeo className="h-4 w-4 text-blue-500" />;
      }
      return <Icons.fileText className="h-4 w-4 text-gray-500" />;
    } catch {
      return <Icons.fileText className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Transcription form state
  const [videoUrl, setVideoUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

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
    refetchInterval: (data) => {
      // Auto-refresh every 5 seconds if there are processing transcriptions
      const hasProcessing = data?.transcriptions?.some((t: Transcription) => t.status === 'processing');
      return hasProcessing ? 5000 : false;
    },
  });

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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const transcriptions = transcriptionData?.transcriptions || [];
  const dailyUsage = user?.transcriptionsUsed || 0;
  const dailyLimit = user?.isPro ? Infinity : 3;
  const isLimitReached = !user?.isPro && dailyUsage >= dailyLimit;

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
              <ThemeToggle />
              <LanguageToggle />
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
              <ThemeToggle />
              <LanguageToggle />
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
            {isLimitReached && !user?.isPro && (
              <Alert className="mb-4">
                <AlertDescription>
                  {t('dashboard.dailyLimitReached')} {t('common.upgradeForUnlimited')}
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
                  
                  {isLimitReached && !user?.isPro && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/${language}/pricing`)}
                      className="flex-1 sm:flex-none"
                    >
                      {t('common.upgrade')}
                    </Button>
                  )}
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
                    <Badge variant={user?.isPro ? "default" : "secondary"}>
                      {user?.isPro ? t('dashboard.pro') : t('dashboard.free')}
                    </Badge>
                    {!user?.isPro && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/${language}/subscribe`)}
                      >
                        {t('dashboard.upgrade')}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.dailyUsage')}</p>
                  <p className="text-lg font-semibold">
                    {dailyUsage} / {user?.isPro ? '∞' : dailyLimit}
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
                    <div className="space-y-4">
                      {transcriptions.map((transcription, index) => (
                        <div key={transcription.id}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getVideoProviderIcon(transcription.videoUrl)}
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {transcription.videoTitle || getVideoTitle(transcription.videoUrl)}
                                </p>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {transcription.status === 'completed' && (
                                  <>
                                    <span>{transcription.duration}s</span>
                                    <span>{transcription.wordCount} {t('history.words')}</span>
                                    <span>{transcription.accuracy}% {t('history.accuracy')}</span>
                                  </>
                                )}
                                <span className="hidden sm:inline">{new Date(transcription.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {transcription.transcript 
                                  ? `${transcription.transcript.substring(0, 150)}...`
                                  : transcription.status === 'processing' 
                                    ? t('status.processing')
                                    : transcription.status === 'pending'
                                    ? t('status.pending') 
                                    : transcription.status === 'failed'
                                    ? t('status.failed')
                                    : t('status.processing')
                                }
                              </p>
                            </div>
                            <div className="flex gap-2 sm:ml-4">
                              <Button
                                variant="outline"
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
                                disabled={!transcription.transcript}
                                className="flex-1 sm:flex-none"
                              >
                                {t('history.copyText')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (transcription.transcript) {
                                    const blob = new Blob([transcription.transcript], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `transcription-${transcription.id}.txt`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                                disabled={!transcription.transcript}
                                className="flex-1 sm:flex-none"
                              >
                                {t('history.download')}
                              </Button>
                            </div>
                          </div>
                          {index < transcriptions.length - 1 && <Separator className="mt-4" />}
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