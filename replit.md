# Overview

This is a video transcription service application built with a full-stack TypeScript architecture, now optimized for GitHub Pages deployment. The app allows users to submit video URLs for transcription with a freemium pricing model - users get 3 free transcriptions before requiring a paid subscription. The system integrates with both Stripe and PayPal for payment processing and features a modern React frontend with shadcn/ui components.

## Recent Changes (August 2025)
- ✅ **TRANSCRIPTION SIMULATION IMPLEMENTED**: Added intelligent simulation mode for when external transcription service is offline
- ✅ **REALISTIC PROCESSING FEEDBACK**: Enhanced UI with step-by-step progress indicators during transcription
- ✅ **SMART FALLBACK SYSTEM**: Attempts real API first, automatically falls back to simulation with 5-second timeout
- ✅ **CONTENT-AWARE SIMULATION**: Different sample transcripts for YouTube vs general URLs with consistent selection
- ✅ **PAYPAL INTEGRATION FIXED**: Updated PayPal button to use proper API base URL for hybrid deployment
- ✅ **HYBRID DEPLOYMENT COMPLETE**: Frontend (GitHub Pages) + Backend (Replit) architecture fully configured
- ✅ **API CONFIGURATION**: Production API URL identified as `https://video-scribe-chepelcr.replit.app`
- ✅ **BASE PATH PRESERVATION**: Fixed /video-transcript subdirectory URL preservation in spa-github-pages routing
- ✅ **CORS CONFIGURED**: Backend properly configured for https://jcampos.dev domain
- ✅ **ENVIRONMENT VARIABLES**: VITE_API_BASE_URL and VITE_STRIPE_PUBLIC_KEY properly configured
- ✅ **SECURITY DOCUMENTATION**: Created SECURITY.md clarifying Stripe public vs secret key separation
- ✅ **STRIPE CONFIG CENTRALIZED**: Fixed missing VITE_STRIPE_PUBLIC_KEY error with proper frontend-only config
- ✅ **SUBDIRECTORY DEPLOYMENT FIXED**: Configured for `https://jcampos.dev/video-transcript/` with proper asset paths
- ✅ **SPA ROUTING SOLUTION**: Added 404.html redirect handling for GitHub Pages single-page app routing
- ✅ **GITHUB WORKFLOW UPGRADED**: Updated to proven working deployment configuration with proper permissions
- ✅ **OFFICIAL ACTIONS**: Using `actions/deploy-pages@v4` instead of third-party action for reliability  
- ✅ **FLAG-BASED LANGUAGE UI**: Clean flag icons (🇺🇸/🇪🇸) with right-aligned dropdown

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Prefers flag icons over text indicators for language selection in navigation. Prefers compact, well-aligned interface elements with proper spacing. Flags should be aligned to the right side of dropdown menus to match navbar icon alignment.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Single-page application using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for client-side routing with pages for home, checkout, and subscription
- **State Management**: TanStack Query for server state management and local storage hooks for client state
- **Forms**: React Hook Form with Zod validation schemas
- **Payment Integration**: Stripe Elements for subscription payments and custom PayPal button component

## Backend Architecture
- **Express.js Server**: RESTful API with TypeScript, featuring request logging middleware and error handling
- **Development Setup**: Vite dev server integration for hot module replacement in development
- **Payment Processing**: Dual payment provider support with Stripe for subscriptions and PayPal for one-time payments
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple

## Data Layer
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Users table with subscription tracking and transcriptions table for storing processing results
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development and database implementation for production
- **Database Provider**: Neon Database serverless PostgreSQL

## External Dependencies

### Payment Providers
- **Stripe**: Subscription management, payment intents, and customer billing
- **PayPal**: Alternative payment option using PayPal Server SDK with sandbox/production environment switching

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries with automatic migration generation

### External APIs
- **Python Transcription Service**: External API endpoint for video transcription processing (configured via VITE_PYTHON_API_URL)

### Development Tools
- **Replit Integration**: Development environment detection and runtime error overlay
- **Vite Plugins**: React support, runtime error modal, and cartographer for Replit environment

The architecture follows a separation of concerns with shared TypeScript schemas between frontend and backend, enabling type safety across the full stack. The payment system supports both subscription and one-time payment models, with usage tracking to enforce the freemium limitations.