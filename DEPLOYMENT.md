# GitHub Pages Deployment Guide - Custom Domain

## Overview
The application is configured for deployment to a custom subdomain: `https://video-transcript.jcampos.dev`

## Prerequisites

### 1. DNS Configuration Required
You must configure DNS records with your domain provider. See `DNS_CONFIGURATION.md` for detailed instructions.

**Required DNS Record:**
- **Type:** CNAME
- **Name:** `video-transcript`  
- **Value:** `<your-github-username>.github.io`

### 2. GitHub Repository Setup
1. Go to the repository on GitHub
2. Click **Settings** tab  
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"** (not Branch)
5. Under **Custom domain**, enter: `video-transcript.jcampos.dev`
6. Enable **"Enforce HTTPS"**
7. Click **Save**

### 3. Repository Visibility  
- Repository MUST be **PUBLIC** for free GitHub Pages
- If private, make repository public or upgrade to GitHub Pro

## Deployment Process

### 1. Automatic Deployment
- Deploys automatically on every push to `main` branch
- Workflow: `.github/workflows/deploy.yml`

### 2. Manual Deployment
1. Go to **Actions** tab
2. Click **"Deploy to GitHub Pages"** workflow  
3. Click **"Run workflow"**  
4. Select main branch and click **"Run workflow"**

### 3. Monitor Progress
1. Watch the workflow in Actions tab
2. Wait for green checkmark ✅ 
3. Check the workflow output for the deployment URL

## Expected URLs After Deployment
- **Main site:** `https://video-transcript.jcampos.dev/`
- **English:** `https://video-transcript.jcampos.dev/en`
- **Spanish:** `https://video-transcript.jcampos.dev/es`
- **Debug mode:** `https://video-transcript.jcampos.dev/?debug=true`

## Troubleshooting

### DNS Issues
- **DNS propagation:** Can take 5-60 minutes
- **SSL certificate:** GitHub may take 15-30 minutes to provision HTTPS
- **Check DNS:** Use `nslookup video-transcript.jcampos.dev`

### GitHub Pages Issues
1. Verify repository is public
2. Check Pages source is "GitHub Actions" not "Branch"
3. Ensure custom domain is correctly entered
4. Check workflow logs for deployment errors

### Configuration Status
- ✅ **Custom domain configured:** `video-transcript.jcampos.dev`
- ✅ **CNAME file created:** `client/public/CNAME`
- ✅ **Base path removed:** No subfolder routing
- ✅ **Asset paths corrected:** Root-relative paths
- ✅ **SPA routing:** 404.html redirects configured
- ✅ **Email templates:** Use custom domain URLs
- ✅ **Multilingual support:** Spanish/English routing

The application is fully configured for custom domain deployment. The main requirements are DNS configuration and GitHub Pages settings.