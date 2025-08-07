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
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredTokens = (tokens: AuthTokens | null): void => {
  if (tokens) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
      
      // Store tokens
      setStoredTokens({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
      
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      return authData;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const authData = response as unknown as AuthResponse;
      
      // Store tokens
      setStoredTokens({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      });
      
      return authData;
    },
    onSuccess: () => {
      // Force refetch user data immediately after successful login
      queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
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