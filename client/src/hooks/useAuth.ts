import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resetPassword, confirmResetPassword, resendSignUpCode } from 'aws-amplify/auth';
import type { 
  AuthResponse, 
  UserResponse, 
  RegisterRequest, 
  LoginRequest, 
  VerifyEmailRequest,
  RefreshTokenRequest 
} from '@shared/auth-schema';

// Amplify handles token storage automatically, so we don't need manual storage utilities

// Amplify authenticated request
const authenticatedRequest = async (
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    // Get current user session using Amplify v6
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }
    

  } catch (error) {
    console.log('No valid Amplify session found');
    // Continue without token for public endpoints
  }

  // Build full URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = baseUrl + endpoint;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle token refresh on 401/403 - Amplify handles this automatically
  if ((response.status === 401 || response.status === 403)) {
    try {
      // Amplify automatically refreshes tokens, so we can retry
      const session = await fetchAuthSession({ forceRefresh: true });
      const idToken = session.tokens?.idToken?.toString();
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
        
        return fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
      }
    } catch (refreshError) {
      console.error('Failed to refresh session, logging out:', refreshError);
      await signOut();
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user using Amplify Auth and user profile endpoint
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/users/profile'],
    queryFn: async () => {
      try {
        // Check if user is authenticated with Amplify
        const amplifyUser = await getCurrentUser();
        if (!amplifyUser) {
          console.log('No valid Amplify session found');
          return null;
        }

        console.log('Amplify user found, fetching user profile...');
        
        // Use the user profile endpoint with Cognito user ID
        const response = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
        if (!response.ok) {
          console.log('Profile request failed with status:', response.status);
          if (response.status === 401 || response.status === 403) {
            await signOut();
            return null;
          }
          throw new Error('Failed to fetch user profile');
        }
        
        const result = await response.json() as UserResponse;
        console.log('User profile fetched successfully:', result.username);
        return result;
      } catch (error) {
        console.log('No authenticated user found');
        return null;
      }
    },
    retry: false,
  });

  // Register mutation using Amplify Auth
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      // Register with Amplify Auth
      const result = await signUp({
        username: data.email, // Use email as username
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName || '',
            family_name: data.lastName || '',
          },
        },
      });

      console.log('Amplify signup result:', result);

      // Get the Cognito user ID from the Amplify result
      const cognitoUserId = result.userId;
      console.log('Cognito user ID:', cognitoUserId);

      // Registration complete with Amplify - no backend sync needed during registration
      // User will be auto-synced to backend when they first log in after email verification
      return {
        amplifyResult: result,
        needsVerification: !result.isSignUpComplete,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
  });

  // Login mutation using Amplify Auth
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      try {
        // First, ensure any existing session is cleared
        try {
          await signOut();
          console.log('Cleared existing session before login');
        } catch (signOutError) {
          console.log('No existing session to clear');
        }

        // Login with Amplify Auth
        const amplifyResult = await signIn({
          username: data.email,
          password: data.password,
        });
        
        console.log('Amplify login successful:', amplifyResult);

        // Check if user needs to verify email
        if (amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          console.log('User needs email verification');
          return { 
            user: null, 
            amplifyResult,
            needsVerification: true,
            email: data.email
          };
        }

        // Get current user to use their ID for profile endpoint
        const amplifyUser = await getCurrentUser();
        const response = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // User exists in Cognito but not in our backend - this will auto-sync on first API usage
            console.log('User not found in backend, will auto-sync on first transcription request');
            // Return basic user data from Cognito instead of backend
            const userData = {
              id: amplifyUser.userId,
              username: amplifyUser.username || amplifyUser.userId,
              email: amplifyUser.signInDetails?.loginId || '',
              freeTranscriptionsUsed: 0,
              maxFreeTranscriptions: 3,
              isSubscribed: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            return { 
              user: userData, 
              amplifyResult,
              needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
            };
          }
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        const userData = await response.json() as UserResponse;
        
        return { 
          user: userData, 
          amplifyResult,
          needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
        };
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Handle specific Cognito errors
        if (error.name === 'UserAlreadyAuthenticatedException' || 
            error.message?.includes('already a signed in user')) {
          // Force sign out and retry
          await signOut();
          console.log('Cleared conflicting session, retrying login...');
          
          const amplifyResult = await signIn({
            username: data.email,
            password: data.password,
          });
          
          // Check if user needs to verify email in retry scenario
          if (amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
            console.log('User needs email verification (retry)');
            return { 
              user: null, 
              amplifyResult,
              needsVerification: true,
              email: data.email
            };
          }
          
          const amplifyUser = await getCurrentUser();
          const response = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // User exists in Cognito but not in our backend - auto-create them
              console.log('User not found in backend during retry, auto-creating...');
              const createResponse = await authenticatedRequest('POST', '/api/users', {
                cognitoUserId: amplifyUser.userId
              });
              if (createResponse.ok) {
                // Retry fetching the profile
                const retryResponse = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
                if (retryResponse.ok) {
                  const userData = await retryResponse.json() as UserResponse;
                  return { 
                    user: userData, 
                    amplifyResult,
                    needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
                  };
                }
              }
            }
            throw new Error(`Failed to fetch user profile during retry: ${response.status}`);
          }
          
          const userData = await response.json() as UserResponse;
          
          return { 
            user: userData, 
            amplifyResult,
            needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
          };
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
  });

  // Verify email mutation using Amplify Auth
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailRequest & { password?: string }) => {
      // Verify signup with Amplify
      const result = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });
      
      console.log('Amplify verification result:', result);
      
      // If verification successful, auto-login and trigger welcome materials
      if (result.isSignUpComplete) {
        try {
          console.log('Calling verification completion endpoint...');
          
          // Auto-login the user after successful verification (if not already logged in)
          if (data.password) {
            try {
              // Check if user is already authenticated
              await getCurrentUser();
              console.log('User already authenticated, skipping auto-login');
            } catch {
              // User not authenticated, proceed with auto-login
              console.log('Auto-logging in user after verification...');
              const signInResult = await signIn({
                username: data.email,
                password: data.password
              });
              console.log('Auto-login successful:', signInResult);
            }
          }
          
          // Small delay to ensure AWS Amplify session is fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get user after successful verification to get user ID
          const amplifyUser = await getCurrentUser();
          
          // Detect language from current URL or localStorage
          const currentLanguage = window.location.pathname.includes('/es') ? 'es' : 'en';
          
          // Call the verification completion endpoint with authentication
          const completionResponse = await authenticatedRequest(
            'POST',
            `/api/users/${amplifyUser.userId}/verify-email-complete?language=${currentLanguage}`
          );
          
          if (completionResponse.ok) {
            console.log('✅ Welcome materials triggered successfully');
          } else {
            console.warn('⚠️ Failed to trigger welcome materials:', completionResponse.status);
          }
        } catch (error) {
          console.warn('Failed to trigger welcome materials:', error);
        }
        
        // If password provided, auto-login
        if (data.password) {
          console.log('Auto-logging in user after verification...');
          const loginResult = await signIn({
            username: data.email,
            password: data.password,
          });
          console.log('Auto-login successful:', loginResult);
        }
      }
      
      return {
        amplifyResult: result,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await resetPassword({ username: email });
      console.log('Forgot password initiated:', result);
      return result;
    },
  });

  // Reset password mutation  
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
      const result = await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });
      console.log('Password reset completed:', result);
      return result;
    },
  });

  // Resend verification code mutation
  const resendVerificationCodeMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const result = await resendSignUpCode({ username: data.email });
      console.log('Verification code resent:', result);
      return result;
    },
  });

  // Logout function using Amplify Auth
  const logout = async () => {
    console.log('Logging out user via Amplify');
    await signOut();
    queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register: registerMutation,
    login: loginMutation,
    verifyEmail: verifyEmailMutation,
    resendVerificationCode: resendVerificationCodeMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    logout,
  };
}