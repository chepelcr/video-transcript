# GitHub Pages Deployment Guide

## ✅ STRIPE ISSUE RESOLVED
The Stripe payment integration is now working correctly! The secret key has been properly configured.

## Current Issue and Solution

### Problem
The GitHub Pages deployment is failing with a 404 error because:
1. GitHub Pages only serves static files (no server-side functionality)
2. This is a full-stack application that requires a backend server
3. Payment processing, database operations, and API routes won't work on GitHub Pages

### Solution for GitHub Pages

#### Step 1: Fix the Build Process
The current workflow tries to run `npm run build:client` but this script doesn't exist in package.json. 

**Option A: Static Frontend Only (Limited Functionality)**
⚠️ **WARNING**: This will break payment processing and video transcription features since they require server-side functionality.

**Option B: Full-Stack Deployment (✅ RECOMMENDED)**
For a full-stack application with both frontend and backend, GitHub Pages won't work. Consider:
- **Replit Deployments**: Native deployment on Replit
- **Vercel**: Excellent for full-stack Next.js/React apps
- **Netlify**: Good for JAMstack applications
- **Railway/Render**: For full-stack Node.js applications

#### Step 2: Fix Base Path
The vite.config.ts needs the correct base path. Replace `your-repository-name` with your actual GitHub repository name:

```typescript
base: "/your-actual-repo-name/",
```

#### Step 3: Environment Variables
GitHub Pages deployment needs these secrets set in your repository:
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (pk_test_...)
- `VITE_PYTHON_API_URL`: Your Python transcription service URL

Note: Server-side secrets like `STRIPE_SECRET_KEY` won't work on GitHub Pages since it's static hosting.

## Stripe Payment Integration Issue

### Problem
The STRIPE_SECRET_KEY is currently set to a publishable key (pk_test_...) instead of a secret key (sk_test_...).

### Solution
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your "Secret key" that starts with `sk_test_`
3. Update the STRIPE_SECRET_KEY secret in Replit
4. Restart the application

## Recommended Deployment Strategy

For this full-stack application with payment processing, I recommend:

1. **Use Replit Deployments** for the full application (frontend + backend)
2. **Use GitHub for version control** and development
3. **Use GitHub Pages only for documentation** or a simple landing page

This way you get:
- ✅ Full payment processing functionality
- ✅ Database connectivity
- ✅ Server-side API routes
- ✅ Environment variable security
- ✅ HTTPS by default