import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/${language}/login`);
    }
  }, [isAuthenticated, authLoading, navigate, language]);

  const { data: transcriptionData, isLoading: transcriptionsLoading } = useQuery({
    queryKey: ['/api/users/transcriptions'],
    enabled: isAuthenticated,
    retry: false,
  });

  const handleLogout = async () => {
    await logout();
    navigate(`/${language}/`);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const transcriptions = (transcriptionData as TranscriptionHistoryResponse)?.transcriptions || [];
  const dailyUsage = user?.transcriptionsUsed || 0;
  const dailyLimit = user?.isPro ? Infinity : 3;
  const isLimitReached = !user?.isPro && dailyUsage >= dailyLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your transcriptions and account settings
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/${language}/profile`)}>
              {t('profile.editProfile')}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/${language}/`)}>
              Back to Home
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.user className="h-5 w-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={user?.isPro ? "default" : "secondary"}>
                      {user?.isPro ? 'Pro' : 'Free'}
                    </Badge>
                    {!user?.isPro && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/${language}/subscribe`)}
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Daily Usage</p>
                  <p className="text-lg font-semibold">
                    {dailyUsage} / {user?.isPro ? '∞' : dailyLimit}
                  </p>
                  {isLimitReached && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Daily limit reached
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Transcriptions</p>
                  <p className="text-lg font-semibold">{transcriptions.length}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-sm">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transcription History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.fileText className="h-5 w-5" />
                  Transcription History
                </CardTitle>
                <CardDescription>
                  Your recent video transcriptions
                </CardDescription>
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
                      No transcriptions yet
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate(`/${language}/`)}
                    >
                      Create Your First Transcription
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {transcriptions.map((transcription, index) => (
                        <div key={transcription.id}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {transcription.videoUrl}
                              </p>
                              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{transcription.duration}s</span>
                                <span>{transcription.wordCount} words</span>
                                <span>{transcription.accuracy}% accuracy</span>
                                <span>{new Date(transcription.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {transcription.transcript.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="ml-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(transcription.transcript);
                                }}
                              >
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const blob = new Blob([transcription.transcript], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `transcription-${transcription.id}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                Download
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