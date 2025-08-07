import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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
import { Icons } from '@/components/ui/icons';

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { verifyEmail, verifyEmailLoading, verifyEmailError } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');

  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Redirect to register if no email
      navigate(`/${language}/register`);
    }
  }, [search, navigate, language]);

  const onSubmit = async (values: VerifyEmailForm) => {
    if (!email) return;

    try {
      await verifyEmail({
        email,
        code: values.code,
      });

      toast({
        title: t('auth.verify.success.title'),
        description: t('auth.verify.success.description'),
      });

      // Small delay to ensure authentication state updates properly
      setTimeout(() => {
        navigate(`/${language}/`);
      }, 500);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.verify.error'),
        variant: 'destructive',
      });
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.verify.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.verify.description')} {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.verify.code')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('auth.verify.codePlaceholder')}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={verifyEmailLoading}>
                {verifyEmailLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('auth.verify.submit')}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {t('auth.verify.noCode')}{' '}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium"
              onClick={() => navigate(`/${language}/register`)}
            >
              {t('auth.verify.backToRegister')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}