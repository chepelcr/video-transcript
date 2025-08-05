# Deployment Guide for VideoScript

This guide covers deploying VideoScript to GitHub Pages as a static frontend application.

## GitHub Pages Deployment

### Prerequisites

1. **GitHub Repository**: Fork or create a new repository with this code
2. **API Keys**: Obtain Stripe and PayPal credentials
3. **Python API**: Your existing Python transcription service should be accessible via HTTPS

### Step-by-Step Deployment

#### 1. Repository Setup

```bash
# Clone your repository
git clone https://github.com/yourusername/videoscript.git
cd videoscript

# Install dependencies locally (for testing)
npm install
```

#### 2. Configure GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

**Required Secrets:**
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (pk_test_... or pk_live_...)
- `VITE_PYTHON_API_URL`: Your Python API base URL (https://your-api-domain.com)

**Optional Secrets (for full payment functionality):**
- `STRIPE_SECRET_KEY`: Your Stripe secret key (for server-side operations)
- `PAYPAL_CLIENT_ID`: Your PayPal client ID
- `PAYPAL_CLIENT_SECRET`: Your PayPal client secret

#### 3. Enable GitHub Pages

1. Go to **Settings > Pages**
2. Select **Source**: "GitHub Actions"
3. The deployment workflow will run automatically on push to main

#### 4. Configure Your Domain (Optional)

If using a custom domain:
1. Update the `cname` field in `.github/workflows/deploy.yml`
2. Configure DNS settings to point to GitHub Pages
3. Add your domain in repository **Settings > Pages > Custom domain**

### Deployment Features

#### Static Build Configuration

The GitHub Actions workflow:
- Builds the React application for production
- Injects environment variables during build
- Deploys to GitHub Pages automatically
- Supports custom domains

#### API Integration

The frontend connects to your Python API for transcription:
- CORS must be configured on your Python API
- API should accept requests from your GitHub Pages domain
- Use HTTPS endpoints for production

### Environment Configuration

#### Development vs Production

**Development (local):**
```bash
VITE_PYTHON_API_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Production (GitHub Pages):**
```bash
VITE_PYTHON_API_URL=https://your-api-domain.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...  # Use live keys for production
```

### Limitations of Static Deployment

#### What Works:
- ✅ Frontend interface and UI
- ✅ Video transcription (via your Python API)
- ✅ Stripe payment processing (client-side)
- ✅ PayPal payments (client-side)
- ✅ Free tier usage tracking (localStorage)

#### What's Limited:
- ❌ Server-side payment webhooks
- ❌ User authentication/accounts
- ❌ Database storage
- ❌ Advanced subscription management

### Python API Requirements

Your Python API must support:

#### CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourusername.github.io"],  # Your GitHub Pages URL
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

#### Expected Endpoint
```
GET /video-listener/listen-video?videoUrl={encoded_url}
```

**Response Format:**
```json
{
  "transcript": "The transcribed text...",
  "duration": 120,
  "confidence": 0.95
}
```

### Testing Your Deployment

#### 1. Local Testing
```bash
npm run dev
# Test at http://localhost:5000
```

#### 2. Production Build Testing
```bash
npm run build
npm run preview
# Test production build locally
```

#### 3. GitHub Pages Testing
- Push to main branch
- Check Actions tab for deployment status
- Visit https://yourusername.github.io/repository-name

### Troubleshooting

#### Common Issues:

**Build Fails:**
- Check GitHub Actions logs
- Verify all required secrets are set
- Ensure no syntax errors in code

**API Calls Fail:**
- Verify CORS configuration on Python API
- Check API URL in environment variables
- Ensure API is accessible via HTTPS

**Payments Don't Work:**
- Verify Stripe keys are correct (test vs live)
- Check browser console for JavaScript errors
- Ensure PayPal credentials are valid

**404 Errors:**
- GitHub Pages might take a few minutes to update
- Check if custom domain DNS is configured correctly
- Verify repository Pages settings

### Advanced Configuration

#### Custom Domain Setup
1. Add CNAME file to repository root with your domain
2. Update workflow to preserve CNAME during deployment
3. Configure DNS A records or CNAME

#### Analytics Integration
Add to `client/index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Security Considerations

- Never expose secret keys in frontend code
- Use environment variables for all sensitive data
- Implement rate limiting on your Python API
- Use HTTPS for all production endpoints
- Validate all user inputs on both frontend and API

### Performance Optimization

- Enable compression on your Python API
- Use CDN for static assets if needed
- Implement loading states for better UX
- Consider implementing request caching

This deployment setup provides a production-ready static frontend that integrates with your existing Python API while maintaining security and performance best practices.