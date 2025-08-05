# Security Guidelines

## Stripe API Keys - Critical Security Information

### ✅ FRONTEND (Safe for GitHub Pages)
**Only use the PUBLISHABLE key in frontend code:**
- `VITE_STRIPE_PUBLIC_KEY=pk_test_...` or `pk_live_...`
- Starts with `pk_` (public key)
- Safe to expose in browser/GitHub Actions
- Used for Stripe Elements UI components

### ❌ BACKEND ONLY (Never expose)
**Secret key must ONLY be in Replit backend:**
- `STRIPE_SECRET_KEY=sk_test_...` or `sk_live_...`  
- Starts with `sk_` (secret key)
- Can charge customers and access sensitive data
- Must NEVER be in frontend code, GitHub Secrets, or browser

## Environment Variable Security

### GitHub Secrets (Frontend Build)
```bash
✅ VITE_STRIPE_PUBLIC_KEY=pk_test_...  # Safe - public key
✅ VITE_API_BASE_URL=https://your-app.replit.app
❌ STRIPE_SECRET_KEY=sk_test_...  # NEVER put this here!
```

### Replit Secrets (Backend Only)
```bash
✅ STRIPE_SECRET_KEY=sk_test_...  # Backend processing only
✅ PAYPAL_CLIENT_SECRET=...
✅ DATABASE_URL=...
```

## Why This Matters

**Frontend Security:**
- Frontend code is visible to all users
- GitHub Actions logs can be public
- Anyone can inspect browser network requests

**Backend Security:**
- Replit environment variables are private
- Secret keys never leave the server
- Payment processing happens securely

## Current Implementation

Your app correctly:
- ✅ Uses `VITE_STRIPE_PUBLIC_KEY` in frontend for Stripe Elements
- ✅ Uses `STRIPE_SECRET_KEY` only in backend for payment processing
- ✅ Separates public and secret operations properly

Never expose secret keys in frontend environments!