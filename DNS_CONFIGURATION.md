# DNS Configuration for Custom Domain

## Required DNS Settings

To set up your custom subdomain `video-transcript.jcampos.dev` for GitHub Pages, you need to configure the following DNS records with your DNS provider:

### DNS Records Required

1. **CNAME Record**
   - **Name/Host:** `video-transcript`
   - **Value/Points to:** `<your-github-username>.github.io`
   - **TTL:** 300 seconds (or default)

   Example:
   ```
   video-transcript.jcampos.dev → <username>.github.io
   ```

### Steps to Configure DNS

1. **Access your DNS provider** (where you manage jcampos.dev)
2. **Add a CNAME record:**
   - Host: `video-transcript`
   - Value: `<your-github-username>.github.io`
   - TTL: 300 (or leave default)

3. **Save the DNS changes**

### Verification

After configuring DNS, you can verify the setup:

1. **DNS Propagation Check:**
   ```bash
   nslookup video-transcript.jcampos.dev
   ```
   Should resolve to GitHub Pages IP addresses.

2. **GitHub Pages Settings:**
   - Go to your repository Settings > Pages
   - Custom domain should show: `video-transcript.jcampos.dev`
   - "Enforce HTTPS" should be enabled

### Expected Timeline

- **DNS propagation:** 5-60 minutes
- **GitHub SSL certificate:** 15-30 minutes after DNS propagation
- **Total time:** Usually complete within 1 hour

### Troubleshooting

If the domain doesn't work:

1. **Check DNS propagation:** Use tools like `dig` or online DNS checkers
2. **Verify CNAME file:** Ensure `client/public/CNAME` contains exactly: `video-transcript.jcampos.dev`
3. **GitHub Pages status:** Check repository Settings > Pages for any errors
4. **SSL certificate:** May take additional time to provision

### Final URLs

Once configured successfully:
- **Main site:** https://video-transcript.jcampos.dev/
- **Spanish:** https://video-transcript.jcampos.dev/es
- **English:** https://video-transcript.jcampos.dev/en

## Important Notes

- The CNAME file has been created in `client/public/CNAME`
- All base path references have been removed from the code
- Email templates now use the custom domain for reset password links
- GitHub workflow has been updated for custom domain deployment