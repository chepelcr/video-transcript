import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { useLanguage } from '@/contexts/LanguageContext';

export function useEmailVerificationGuard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        // Check if user just completed verification successfully
        const justVerified = sessionStorage.getItem('justVerified');
        if (justVerified) {
          console.log('🎉 User just verified, skipping email verification check');
          sessionStorage.removeItem('justVerified');
          return;
        }
        
        // Get current Amplify user
        const user = await getCurrentUser();
        if (!user) {
          return; // No user logged in
        }

        // Get user session to check email verification
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken;
        
        if (idToken) {
          // Decode token to check email_verified claim
          const payload = idToken.payload;
          const emailVerified = payload.email_verified;
          
          if (!emailVerified) {
            // User email is not verified, redirect to verification page
            console.log('Email not verified, redirecting to verification page');
            
            // Store user email for verification page
            if (payload.email) {
              sessionStorage.setItem('verificationData', JSON.stringify({
                email: payload.email,
                timestamp: Date.now()
              }));
            }
            
            navigate(`/${language}/verify-email`);
          }
        }
      } catch (error) {
        console.log('Email verification check failed:', error);
      }
    };

    checkEmailVerification();
  }, [navigate, language]);
}

export function useRequireEmailVerification() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  const checkAndRedirect = async (): Promise<boolean> => {
    try {
      // Get current Amplify user
      const user = await getCurrentUser();
      if (!user) {
        navigate(`/${language}/login`);
        return false;
      }

      // Get user session to check email verification
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      
      if (idToken) {
        // Decode token to check email_verified claim
        const payload = idToken.payload;
        const emailVerified = payload.email_verified;
        
        if (!emailVerified) {
          console.log('Email not verified, redirecting to verification page');
          
          // Store user email for verification page
          if (payload.email) {
            sessionStorage.setItem('verificationData', JSON.stringify({
              email: payload.email,
              timestamp: Date.now()
            }));
          }
          
          navigate(`/${language}/verify-email`);
          return false;
        }
        
        return true; // Email is verified
      }
      
      return false;
    } catch (error) {
      console.log('Email verification check failed:', error);
      navigate(`/${language}/login`);
      return false;
    }
  };

  return { checkAndRedirect };
}