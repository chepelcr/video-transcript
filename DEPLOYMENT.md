# GitHub Pages Deployment Guide

## Current Issue: "You need to join the team to see this project"

This error indicates the GitHub Pages deployment isn't properly configured. Follow these steps:

### 1. Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Verify Workflow Permissions
1. In repository Settings > **Actions** > **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save changes

### 3. Trigger Deployment
1. Push any change to the `main` branch
2. Go to **Actions** tab to watch the workflow
3. Wait for "Deploy to GitHub Pages" to complete
4. Check the workflow output for the deployment URL

### 4. Expected URLs After Deployment
- Main site: `https://jcampos.dev/video-transcript/`
- English: `https://jcampos.dev/video-transcript/en`
- Spanish: `https://jcampos.dev/video-transcript/es`
- Debug mode: `https://jcampos.dev/video-transcript/?debug=true`

### 5. Troubleshooting
If the error persists:
1. Check if the repository is public (GitHub Pages free requires public repo)
2. Verify the workflow ran successfully in Actions tab
3. Check the Pages settings show a green checkmark
4. Try the debug URL to see detailed error information

### 6. Current Configuration
- ✅ Subdirectory deployment configured (`/video-transcript/`)
- ✅ Asset paths automatically fixed in build process
- ✅ SPA routing handled with 404.html redirects
- ✅ Language routing works with subdirectory
- ✅ Favicon and debug logging added

The routing logic is correct - the issue is that GitHub Pages isn't deployed yet.

## Backend Deployment Instructions

### Current Setup
- **Frontend**: Deployed on GitHub Pages at `https://jcampos.dev/video-transcript/`
- **Backend**: Running on Replit at `https://video-scribe-chepelcr.replit.app`
- **Database**: AWS RDS PostgreSQL at `ls-85945ed6753f404b7b7d74097b833502d2a152ef.co1kq0qg0vtn.us-east-1.rds.amazonaws.com`

### AWS RDS Database Connection
✅ **Successfully Connected**: Backend now uses AWS RDS PostgreSQL instead of Neon Database
✅ **SSL Configured**: Proper SSL configuration for AWS RDS connections
✅ **Schema Applied**: All tables (users, transcriptions, refresh_tokens) are present and functioning
✅ **Data Verified**: Existing user data (1 user, 1 transcription) preserved

### Environment Variables (Already Configured)
- `AWS_RDS_DATABASE_URL`: Connection string for AWS RDS PostgreSQL
- `AWS_RDS_USERNAME`, `AWS_RDS_PASSWORD`, `AWS_RDS_DATABASE_NAME`: Database credentials
- `VITE_API_BASE_URL`: Points to Replit backend
- `VITE_STRIPE_PUBLIC_KEY`: Public Stripe key for frontend payments
- CORS configured for `https://jcampos.dev` domain

### Docker Support for Local Testing
✅ **Complete Docker Setup**: Multi-stage Dockerfile with development and production configurations
✅ **Database Integration**: Docker Compose includes PostgreSQL for local development
✅ **Hot Reloading**: Development environment with live code changes
✅ **Health Checks**: Container monitoring and automatic restarts
✅ **Makefile Commands**: Simplified Docker operations (`make dev`, `make prod`, `make stop`)

### Quick Local Testing
```bash
# Start local development with Docker
make dev

# Or manually
docker-compose -f docker-compose.dev.yml up

# Check health endpoint
curl http://localhost:5000/health
```

The hybrid deployment architecture is now enhanced with AWS RDS database integration and complete local development support via Docker.