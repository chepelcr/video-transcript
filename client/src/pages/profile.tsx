import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRequireEmailVerification } from '@/hooks/useEmailVerification';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Crown, Calendar, ArrowLeft } from 'lucide-react';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { checkAndRedirect } = useRequireEmailVerification();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Check email verification when component loads
  useEffect(() => {
    if (!isLoading && user) {
      checkAndRedirect();
    }
  }, [isLoading, user, checkAndRedirect]);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest('PUT', '/api/auth/profile', data);
      return response;
    },
    onSuccess: async (updatedUser) => {
      toast({
        title: t('profile.update.success.title'),
        description: t('profile.update.success.description'),
      });
      
      // Invalidate user query to refetch updated data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Wait a bit for the cache to update, then redirect
      setTimeout(() => {
        navigate(`/${language}/dashboard`);
      }, 1500); // Wait 1.5 seconds to show the success message
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('profile.update.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    await updateProfileMutation.mutateAsync(values);
  };

  // Update form when user data loads
  useEffect(() => {
    if (user && !updateProfileMutation.isPending) {
      form.reset({
        username: user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user, form, updateProfileMutation.isPending]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Please log in to view your profile.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${language}/dashboard`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('profile.title')}
          </h1>
        </div>
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.email}</span>
                {user.isEmailVerified && (
                  <Badge variant="secondary" className="text-xs">
                    {t('profile.verified')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium capitalize">
                  {user.subscriptionTier} {t('profile.plan')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t('profile.memberSince')} {new Date(user.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.transcriptionsUsed || 0} {t('profile.transcriptionsUsed')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.edit.title')}</CardTitle>
            <CardDescription>
              {t('profile.edit.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.edit.username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('profile.edit.usernamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.edit.firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('profile.edit.firstNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('profile.edit.lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('profile.edit.lastNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>
                      {t('profile.edit.emailNote')}: {user.email}
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('profile.edit.submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}