// API Configuration for different environments
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5000',
  },
  production: {
    // Replit backend API for hybrid deployment
    apiBaseUrl: 'https://rest-express--jcampos8.replit.app',
  }
};

const environment = import.meta.env.MODE === 'production' ? 'production' : 'development';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || config[environment].apiBaseUrl;

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