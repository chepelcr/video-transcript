# Hybrid Deployment Guide: GitHub Pages + Replit Backend

This guide shows how to deploy your frontend to GitHub Pages while keeping the backend on Replit.

## Architecture Overview

```
GitHub Pages (Static Frontend)  ←→  Replit Backend (API & Database)
- React application                  - Express.js server
- Static HTML/CSS/JS                 - Stripe/PayPal processing
- Fast CDN delivery                  - Database operations
```

## Step 1: Deploy Backend to Replit

### 1.1 Deploy on Replit
1. Click the "Deploy" button in your Replit workspace
2. Choose your deployment settings
3. Your backend will be available at: `https://your-replit-app.replit.app`

### 1.2 Update CORS Configuration
The backend is already configured with CORS headers. Update line 15 in `server/index.ts`:
```typescript
'https://yourusername.github.io', // Replace with your actual GitHub username
```

## Step 2: Configure Frontend for Production

### 2.1 Set Environment Variables in GitHub
Go to your repository Settings > Secrets and variables > Actions, and add:

```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_BASE_URL=https://your-replit-app.replit.app
```

### 2.2 Configure Base Path for Subdirectory
Since your site is deployed at `https://video-transcript.jcampos.dev/`, the build command in the GitHub workflow uses the root path:
```bash
npm run build
```

This ensures all asset paths are correctly prefixed for the subdirectory deployment.

## Step 3: Deploy Frontend to GitHub Pages

### 3.1 Push Changes to GitHub
```bash
git add .
git commit -m "Configure hybrid deployment"
git push origin main
```

### 3.2 Enable GitHub Pages
1. Go to your repository Settings > Pages
2. Set Source to "GitHub Actions"
3. The workflow uses the official `actions/deploy-pages@v4` for reliable deployment
4. Uses proper permissions and artifact upload for GitHub Pages environment
5. Automatic deployment triggers on push to main branch

## Step 4: Verify Deployment

### 4.1 Check GitHub Actions
1. Go to your repository > Actions tab
2. Verify the workflow completed successfully
3. Check that the `github-pages` environment was deployed

### 4.2 Test Your Site
1. Visit your GitHub Pages URL (shown in Actions output)
2. Open browser dev tools and check for API connectivity
3. Test language switching (flags work correctly)
4. Verify payment integration connects to your Replit backend

### 4.3 Common Issues Fixed
- ✅ **Subdirectory Deployment**: Asset paths automatically corrected for `/video-transcript/` base path
- ✅ **SPA Routing**: 404.html handles client-side routing redirects properly
- ✅ **CORS Configuration**: Domain `https://jcampos.dev` configured in backend
- **Remaining Setup**: Ensure GitHub Secrets contain your Replit backend URL

## Environment Configuration

### Development (localhost:5173)
- API Base URL: `http://localhost:5000` (local backend)
- All features work locally

### Production (GitHub Pages)
- API Base URL: `https://your-replit-app.replit.app` (Replit backend)
- Frontend served from GitHub CDN
- Backend handles payments and database

## Benefits of This Setup

✅ **Fast Frontend**: GitHub Pages CDN delivers static assets quickly
✅ **Full Backend**: Replit handles complex operations (payments, database)
✅ **Cost Effective**: GitHub Pages is free, Replit handles only backend
✅ **Easy Updates**: Push to GitHub updates frontend, Replit handles backend
✅ **Security**: Sensitive operations stay on secure Replit backend

## Troubleshooting

### CORS Issues
- Verify your GitHub Pages URL is in the CORS allowlist
- Check browser dev tools for CORS errors
- Ensure credentials are handled properly

### API Connection Issues
- Verify VITE_API_BASE_URL is set correctly in GitHub Secrets
- Check that Replit deployment is active and responding
- Test API endpoints directly

### Build Issues
- Ensure all environment variables are set in GitHub Secrets
- Check GitHub Actions logs for build errors
- Verify all imports resolve correctly

## Next Steps

1. Deploy backend to Replit
2. Get your Replit deployment URL
3. Update CORS configuration with your GitHub Pages URL
4. Set GitHub Secrets with correct API URL
5. Push to trigger deployment
6. Test the integrated application

Your video transcription app will now have:
- Lightning-fast frontend delivery via GitHub Pages
- Full payment processing via Replit backend
- Professional deployment with custom domain support