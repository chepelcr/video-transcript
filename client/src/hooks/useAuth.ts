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

      // Sync to backend after Amplify registration, including Cognito user ID
      const backendData = {
        ...data,
        cognitoUserId: cognitoUserId
      };
      const response = await apiRequest('POST', '/api/auth/register', backendData);
      
      return {
        amplifyResult: result,
        backendResponse: response,
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

        // Get current user to use their ID for profile endpoint
        const amplifyUser = await getCurrentUser();
        const response = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // User exists in Cognito but not in our backend - auto-create them
            console.log('User not found in backend, auto-creating...');
            const createResponse = await authenticatedRequest('POST', '/api/auth/sync-user');
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
          
          const amplifyUser = await getCurrentUser();
          const response = await authenticatedRequest('GET', `/api/users/${amplifyUser.userId}/profile`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // User exists in Cognito but not in our backend - auto-create them
              console.log('User not found in backend during retry, auto-creating...');
              const createResponse = await authenticatedRequest('POST', '/api/auth/sync-user');
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
      
      // If verification successful and password provided, auto-login
      if (result.isSignUpComplete && data.password) {
        console.log('Auto-logging in user after verification...');
        const loginResult = await signIn({
          username: data.email,
          password: data.password,
        });
        console.log('Auto-login successful:', loginResult);
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