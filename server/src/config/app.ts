export const APP_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET!,
  SESSION_SECRET: process.env.SESSION_SECRET!,
  
  // AWS Configuration
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
  
  // Email Configuration
  FROM_EMAIL: process.env.FROM_EMAIL,
  AWS_SES_SMTP_USERNAME: process.env.AWS_SES_SMTP_USERNAME,
  AWS_SES_SMTP_PASSWORD: process.env.AWS_SES_SMTP_PASSWORD,
  
  // Payment Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  
  // External APIs
  TRANSCRIPTION_WEBHOOK_SECRET: process.env.TRANSCRIPTION_WEBHOOK_SECRET,
  
  // CORS Configuration
  ALLOWED_ORIGINS: [
    'https://a84950eb-2031-40c4-8a39-1789c99c8ca2-00-2c46rofc44noa.spock.replit.dev',
    'https://video-transcript.jcampos.dev'
  ]
} as const;

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
}