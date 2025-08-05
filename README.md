# Video Transcription Service 🎥

A professional video transcription application with hybrid deployment architecture - static frontend on GitHub Pages connected to Replit backend API.

## 🚀 Features

- **Freemium Model**: 3 free transcriptions, then $19/month Pro plan
- **Dual Payment Support**: Stripe subscriptions + PayPal one-time payments
- **Multilingual**: Complete Spanish/English support with flag-based UI
- **Modern Design**: shadcn/ui components with dark/light mode
- **Hybrid Deployment**: Fast GitHub Pages frontend + powerful Replit backend

## 🏗️ Architecture

```
GitHub Pages (Frontend) ←→ Replit (Backend)
├── React + TypeScript    ├── Express.js API
├── Stripe/PayPal UI      ├── Payment processing
├── Multilingual support  ├── PostgreSQL database
└── Responsive design     └── Transcription API
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account (test keys)
- PayPal developer account

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:5173` for the app.

## 🚀 Deployment

### Option 1: Hybrid Deployment (Recommended)
Deploy frontend to GitHub Pages, backend to Replit:

1. **Deploy Backend to Replit**
   - Click "Deploy" in your Replit workspace
   - Get your deployment URL: `https://your-app.replit.app`

2. **Configure GitHub Secrets**
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   VITE_API_BASE_URL=https://your-app.replit.app
   VITE_PYTHON_API_URL=https://your-transcription-api.com
   ```

3. **Update CORS Settings**
   - Edit `server/index.ts` line 15 with your GitHub Pages URL
   - Set `FRONTEND_URL` environment variable in Replit

4. **Deploy Frontend**
   - Push to GitHub main branch
   - GitHub Actions will automatically deploy to Pages

See [HYBRID_DEPLOYMENT.md](HYBRID_DEPLOYMENT.md) for detailed instructions.

### Option 2: Full Replit Deployment
Deploy everything on Replit using the "Deploy" button.

## 🔧 Configuration

### Environment Variables

#### Replit (Backend)
```bash
# Database (auto-configured)
DATABASE_URL=postgresql://...

# Payment APIs
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# CORS
FRONTEND_URL=https://yourusername.github.io
```

#### GitHub (Frontend Build)
```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_BASE_URL=https://your-app.replit.app
VITE_PYTHON_API_URL=https://transcription-api.com
```

## 🌍 Internationalization

The app supports English and Spanish with:
- Dynamic language switching with flag icons (🇺🇸/🇪🇸)
- Complete UI translation
- Localized payment flows
- Right-to-left text support ready

## 💳 Payment Integration

### Stripe (Subscriptions)
- Monthly Pro plan: $19/month
- Automatic billing management
- Customer portal access

### PayPal (Alternative)
- One-time payments
- Sandbox/production switching
- International support

## 🔒 Security

- Environment-based API URLs
- CORS protection for cross-origin requests
- Secure payment processing
- Session management with PostgreSQL store

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interfaces
- Progressive Web App ready
- Dark/light mode support

## 🔧 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite build system
- shadcn/ui + Tailwind CSS
- TanStack Query for state management
- Wouter for routing

**Backend**
- Express.js + TypeScript
- Drizzle ORM + PostgreSQL
- Stripe & PayPal SDKs
- Session-based authentication

**Deployment**
- GitHub Pages (frontend)
- Replit Deployments (backend)
- Automated CI/CD with GitHub Actions

## 📊 Performance

- **Frontend**: CDN delivery via GitHub Pages
- **Backend**: Scalable Replit infrastructure
- **Database**: Neon serverless PostgreSQL
- **Payments**: Direct API integration (no redirects)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Replit and deployed on GitHub Pages