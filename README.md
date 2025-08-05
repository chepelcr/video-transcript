# VideoScript - AI-Powered Video Transcription Service

A modern, responsive web application that transforms video URLs into accurate text transcriptions using AI technology. Built with React, TypeScript, and integrated with Stripe and PayPal for payment processing.

## 🚀 Features

- **Free Tier**: 3 free transcriptions per month
- **Pro Plan**: Unlimited transcriptions with premium features ($19/month)
- **Multi-Provider Payments**: Support for both Stripe and PayPal
- **Real-time Processing**: Fast video transcription via Python API
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Mobile Responsive**: Works seamlessly on all devices
- **GitHub Pages Ready**: Optimized for static deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **shadcn/ui** for styling
- **Wouter** for client-side routing
- **TanStack Query** for data fetching
- **Stripe Elements** for payment processing

### Backend
- **Express.js** with TypeScript
- **Stripe SDK** for subscription management
- **PayPal Server SDK** for payment processing
- **Drizzle ORM** with PostgreSQL

### External Services
- **Python Transcription API** (your existing service)
- **Stripe** for subscriptions and payments
- **PayPal** for alternative payment processing

## 📦 Deployment Options

### 1. GitHub Pages (Static Frontend Only)

Perfect for demonstration purposes with external API integration:

1. Fork this repository
2. Set up GitHub Secrets in your repository settings:
   - `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key
   - `VITE_PYTHON_API_URL`: Your Python API endpoint URL

3. Enable GitHub Pages in repository settings (Actions source)
4. Push to main branch - automatic deployment via GitHub Actions

### 2. Full-Stack Deployment (Replit, Vercel, etc.)

For complete functionality including payment processing:

1. Clone the repository
2. Install dependencies: `npm install`  
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`
5. Deploy to your preferred platform

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PayPal Configuration  
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# Python API
VITE_PYTHON_API_URL=https://your-api-domain.com
```

### API Integration

The app expects your Python API to have this endpoint:
```
GET /video-listener/listen-video?videoUrl={url}
```

Returns transcription data in JSON format.

## 🎨 Customization

### Styling
- Colors defined in `client/src/index.css`
- Uses CSS custom properties for theming
- Tailwind configuration in `tailwind.config.ts`

### Payment Plans
Update pricing in:
- `client/src/pages/home.tsx` (pricing display)
- `server/routes.ts` (Stripe price IDs)

### Branding
- Logo/brand name: Search for "VideoScript" in components
- Meta tags: Update in `client/index.html`

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Features Overview

### Free Tier
- 3 transcriptions per month
- Up to 10 minutes per video
- Basic accuracy
- TXT download format

### Pro Plan ($19/month)
- Unlimited transcriptions
- Up to 2 hours per video
- 99% accuracy
- Multiple formats (TXT, SRT, VTT)
- Priority processing
- Email support

### Enterprise (Custom Pricing)
- Everything in Pro
- Custom API integration
- White-label options
- 24/7 phone support
- SLA guarantee

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues with the application:
1. Check the GitHub Issues
2. Review the configuration guide
3. Ensure all environment variables are set correctly

For payment processing issues:
- Stripe: Check your Stripe Dashboard
- PayPal: Check your PayPal Developer Console

---

Built with ❤️ for seamless video transcription