// API Configuration for different environments
// Detect if we're in Replit environment (HTTPS)
const isReplitEnv = window.location.hostname.includes('replit.dev');
const isHttps = window.location.protocol === 'https:';

const config = {
  development: {
    // In Replit, backend and frontend run on same port/origin
    apiBaseUrl: (isHttps && isReplitEnv) ? 
      `${window.location.protocol}//${window.location.host}` : 
      'http://localhost:5000',
  },
  production: {
    // Replit backend API for hybrid deployment
    apiBaseUrl: 'https://video-scribe-chepelcr.replit.app',
  }
};

// Force development mode but with smart URL detection
const environment = 'development'; // import.meta.env.MODE === 'production' ? 'production' : 'development';

export const API_BASE_URL = '/api'; // Frontend-only mode with mock API

// Debug logging
console.log('Frontend-only mode: Using mock API services', {
  apiBaseUrl: API_BASE_URL
});

// Base path configuration for GitHub Pages subdirectory deployment
export const BASE_PATH = import.meta.env.MODE === 'production' ? '/video-transcript' : '';

// Helper function to create proper URLs for the subdirectory deployment
export const createUrl = (path: string) => {
  // Remove leading slash to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE_PATH ? `${BASE_PATH}/${cleanPath}` : `/${cleanPath}`;
};

export const isProduction = import.meta.env.MODE === 'production';
export const isDevelopment = !isProduction;

// Stripe configuration - ONLY public key for frontend
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Graceful handling of missing Stripe key
if (!STRIPE_PUBLIC_KEY) {
  if (import.meta.env.MODE === 'production') {
    console.error('Missing VITE_STRIPE_PUBLIC_KEY environment variable. Stripe payments will not work.');
  } else {
    console.warn('VITE_STRIPE_PUBLIC_KEY not set in development.');
  }
}