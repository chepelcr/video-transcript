import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL } from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Refresh token function
async function refreshAccessToken(): Promise<boolean> {
  try {
    const authTokens = localStorage.getItem('auth_tokens');
    if (!authTokens) {
      return false;
    }

    const tokens = JSON.parse(authTokens);
    if (!tokens.refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear stored tokens
      localStorage.removeItem('auth_tokens');
      return false;
    }

    const data = await response.json();
    
    // Store new tokens
    localStorage.setItem('auth_tokens', JSON.stringify({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }));

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('auth_tokens');
    return false;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Get the access token from localStorage
  let accessToken = null;
  try {
    const authTokens = localStorage.getItem('auth_tokens');
    if (authTokens) {
      const tokens = JSON.parse(authTokens);
      accessToken = tokens.accessToken;
    }
  } catch (error) {
    console.error('Error getting auth tokens:', error);
  }
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If unauthorized and we have a refresh token, try to refresh and retry
  if ((res.status === 401 || res.status === 403) && accessToken) {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Retry with new token
      const newAuthTokens = localStorage.getItem('auth_tokens');
      if (newAuthTokens) {
        const newTokens = JSON.parse(newAuthTokens);
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        const retryRes = await fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        
        await throwIfResNotOk(retryRes);
        return retryRes;
      }
    } else {
      // Refresh failed, redirect to login or handle logout
      window.location.href = '/en/auth/login';
      throw new Error('401: Session expired, please login again');
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Get the access token from localStorage
    let accessToken = null;
    try {
      const authTokens = localStorage.getItem('auth_tokens');
      if (authTokens) {
        const tokens = JSON.parse(authTokens);
        accessToken = tokens.accessToken;
      }
    } catch (error) {
      console.error('Error getting auth tokens:', error);
    }
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    // Handle unauthorized with token refresh
    if ((res.status === 401 || res.status === 403) && accessToken) {
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry with new token
        const newAuthTokens = localStorage.getItem('auth_tokens');
        if (newAuthTokens) {
          const newTokens = JSON.parse(newAuthTokens);
          headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
          
          const retryRes = await fetch(fullUrl, {
            headers,
            credentials: "include",
          });
          
          if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
            return null;
          }
          
          await throwIfResNotOk(retryRes);
          return await retryRes.json();
        }
      } else if (unauthorizedBehavior === "returnNull") {
        return null;
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/en/auth/login';
        throw new Error('401: Session expired, please login again');
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
