import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { 
  AuthResponse, 
  UserResponse, 
  RegisterRequest, 
  LoginRequest, 
  VerifyEmailRequest,
  RefreshTokenRequest 
} from '@shared/auth-schema';

const AUTH_STORAGE_KEY = 'auth_tokens';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Storage utilities
const getStoredTokens = (): AuthTokens | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    console.log('Getting stored tokens:', stored ? 'Found' : 'Not found');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

const setStoredTokens = (tokens: AuthTokens | null): void => {
  try {
    if (tokens) {
      console.log('Storing tokens:', { hasAccess: !!tokens.accessToken, hasRefresh: !!tokens.refreshToken });
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
    } else {
      console.log('Clearing tokens');
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

// Custom fetch with token
const authenticatedRequest = async (
  method: string,
  endpoint: string,
  data?: any
): Promise<Response> => {
  const tokens = getStoredTokens();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (tokens) {
    headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  // Build full URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = baseUrl + endpoint;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle token refresh on 401/403
  if ((response.status === 401 || response.status === 403) && tokens) {
    try {
      const refreshResponse = await apiRequest('POST', '/api/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });
      
      const authData = refreshResponse as unknown as AuthResponse;
      const newTokens = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      };
      
      setStoredTokens(newTokens);
      
      // Retry original request with new token
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const fullUrl = baseUrl + endpoint;
      const retryResponse = await fetch(fullUrl, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return retryResponse;
    } catch {
      // Refresh failed, clear tokens
      setStoredTokens(null);
      throw new Error('Authentication failed');
    }
  }

  return response;
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const tokens = getStoredTokens();
      if (!tokens?.accessToken) {
        console.log('No access token found');
        return null;
      }

      console.log('Attempting to fetch user with token:', tokens.accessToken.substring(0, 20) + '...');
      
      const response = await authenticatedRequest('GET', '/api/auth/me');
      if (!response.ok) {
        console.log('Auth request failed with status:', response.status);
        if (response.status === 401 || response.status === 403) {
          setStoredTokens(null);
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

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response;
    },
  });

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await apiRequest('POST', '/api/auth/verify-email', data);
      const authData = response as unknown as AuthResponse;
      
      console.log('Verify email response:', { 
        hasUser: !!authData.user, 
        hasTokens: !!(authData.accessToken && authData.refreshToken),
        username: authData.user?.username 
      });
      
      // Store tokens
      setStoredTokens({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
      
      return authData;
    },
    onSuccess: (authData) => {
      console.log('Verify email success, refetching user data...');
      // Force immediate refetch of user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      console.log('Attempting login...');
      const response = await apiRequest('POST', '/api/auth/login', data);
      const authData = await response.json() as AuthResponse;
      
      console.log('Login response received:', { 
        hasUser: !!authData.user, 
        hasTokens: !!(authData.accessToken && authData.refreshToken),
        actualData: authData 
      });
      
      // Store tokens
      const tokens = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      };
      
      setStoredTokens(tokens);
      console.log('Tokens stored successfully');
      
      return authData;
    },
    onSuccess: (data) => {
      console.log('Login mutation success, refetching user data...');
      // Force refetch user data immediately after successful login
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const tokens = getStoredTokens();
      if (tokens) {
        try {
          await authenticatedRequest('POST', '/api/auth/logout', {
            refreshToken: tokens.refreshToken,
          });
        } catch {
          // Ignore logout errors
        }
      }
      
      // Clear local storage
      setStoredTokens(null);
      
      // Clear all queries
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    verifyEmail: verifyEmailMutation.mutateAsync,
    verifyEmailLoading: verifyEmailMutation.isPending,
    verifyEmailError: verifyEmailMutation.error,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    logoutLoading: logoutMutation.isPending,
  };
}