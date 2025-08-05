// API Configuration for different environments
const config = {
  development: {
    apiBaseUrl: 'http://localhost:5000',
  },
  production: {
    // Replace with your actual Replit deployment URL when ready
    apiBaseUrl: 'https://your-replit-app.replit.app',
  }
};

const environment = import.meta.env.MODE === 'production' ? 'production' : 'development';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || config[environment].apiBaseUrl;

export const isProduction = import.meta.env.MODE === 'production';
export const isDevelopment = !isProduction;