import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
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

  // Get current user using Amplify Auth
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        // Check if user is authenticated with Amplify
        const amplifyUser = await getCurrentUser();
        if (!amplifyUser) {
          console.log('No valid Amplify session found');
          return null;
        }

        console.log('Amplify user found, fetching backend user data...');
        
        const response = await authenticatedRequest('GET', '/api/auth/me');
        if (!response.ok) {
          console.log('Auth request failed with status:', response.status);
          if (response.status === 401 || response.status === 403) {
            await signOut();
            return null;
          }
          throw new Error('Failed to fetch user');
        }
        
        const result = await response.json() as UserResponse;
        console.log('User fetched successfully:', result.username);
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

      // Sync to backend after Amplify registration
      const response = await apiRequest('POST', '/api/auth/register', data);
      
      return {
        amplifyResult: result,
        backendResponse: response,
        needsVerification: !result.isSignUpComplete,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Login mutation using Amplify Auth
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Login with Amplify Auth
      const amplifyResult = await signIn({
        username: data.email,
        password: data.password,
      });
      
      console.log('Amplify login successful:', amplifyResult);

      // Sync with backend to get user data
      const response = await authenticatedRequest('GET', '/api/auth/me');
      const userData = await response.json() as UserResponse;
      
      return { 
        user: userData, 
        amplifyResult,
        needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Verify email mutation using Amplify Auth
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      // Verify signup with Amplify
      const result = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });
      
      console.log('Amplify verification result:', result);
      
      // Sync verification status with backend
      const response = await apiRequest('POST', '/api/auth/verify-email', data);
      return {
        amplifyResult: result,
        backendResponse: response.json(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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

  // Logout function using Amplify Auth
  const logout = async () => {
    console.log('Logging out user via Amplify');
    await signOut();
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    logout,
  };
}