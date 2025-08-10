import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import CognitoAuthService from '@/lib/cognito';
import type { 
  AuthResponse, 
  UserResponse, 
  RegisterRequest, 
  LoginRequest, 
  VerifyEmailRequest,
  RefreshTokenRequest 
} from '@shared/auth-schema';

const AUTH_STORAGE_KEY = 'cognito_tokens';

interface CognitoTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

// Cognito token storage utilities
const getStoredTokens = (): CognitoTokens | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    console.log('Getting stored tokens:', stored ? 'Found' : 'Not found');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

const setStoredTokens = (tokens: CognitoTokens | null): void => {
  try {
    if (tokens) {
      console.log('Storing Cognito tokens:', { 
        hasAccess: !!tokens.accessToken, 
        hasRefresh: !!tokens.refreshToken,
        hasId: !!tokens.idToken 
      });
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
    } else {
      console.log('Clearing Cognito tokens');
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

// Cognito authenticated request
const authenticatedRequest = async (
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> => {
  // Get fresh session from Cognito
  const session = await CognitoAuthService.getCurrentSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session) {
    headers.Authorization = `Bearer ${session.getIdToken().getJwtToken()}`;
  }

  // Build full URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = baseUrl + endpoint;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle token refresh on 401/403 using Cognito
  if ((response.status === 401 || response.status === 403) && session) {
    try {
      const refreshedSession = await CognitoAuthService.refreshSession();
      if (refreshedSession) {
        // Retry with new tokens
        headers.Authorization = `Bearer ${refreshedSession.getIdToken().getJwtToken()}`;
        return fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
      } else {
        throw new Error('Failed to refresh session');
      }
    } catch (refreshError) {
      console.error('Failed to refresh Cognito session, logging out:', refreshError);
      CognitoAuthService.logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user using Cognito session
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      // Check if user has valid Cognito session
      const session = await CognitoAuthService.getCurrentSession();
      if (!session) {
        console.log('No valid Cognito session found');
        return null;
      }

      const idToken = session.getIdToken().getJwtToken();
      console.log('Attempting to fetch user with Cognito token:', idToken.substring(0, 20) + '...');
      
      const response = await authenticatedRequest('GET', '/api/auth/me');
      if (!response.ok) {
        console.log('Auth request failed with status:', response.status);
        if (response.status === 401 || response.status === 403) {
          CognitoAuthService.logout();
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      
      const result = await response.json() as UserResponse;
      console.log('User fetched successfully:', result.username);
      return result;
    },
    retry: false,
  });

  // Register mutation using Cognito
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      // Register with Cognito first, then sync to backend
      const cognitoResult = await CognitoAuthService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // After Cognito registration, sync to backend
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Login mutation using Cognito
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Login with Cognito
      const cognitoResult = await CognitoAuthService.login(data.email, data.password);
      
      // Store tokens
      setStoredTokens({
        accessToken: cognitoResult.accessToken,
        refreshToken: cognitoResult.refreshToken,
        idToken: cognitoResult.idToken,
      });

      // Sync with backend to get user data
      const response = await authenticatedRequest('GET', '/api/auth/me');
      const userData = await response.json() as UserResponse;
      
      return { user: userData, ...cognitoResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Verify email mutation (Cognito handles verification)
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      // With Cognito, verification is handled during registration
      const response = await apiRequest('POST', '/api/auth/verify-email', data);
      return response.json();
    },
  });

  // Logout function
  const logout = () => {
    console.log('🔐 Logging out user');
    CognitoAuthService.logout();
    setStoredTokens(null);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register: registerMutation,
    login: loginMutation,
    verifyEmail: verifyEmailMutation,
    logout,
  };
}