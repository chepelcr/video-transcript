# Overview

This is a video transcription service application built with a full-stack TypeScript architecture, now optimized for GitHub Pages deployment. The app allows users to submit video URLs for transcription with a freemium pricing model - users get 3 free transcriptions before requiring a paid subscription. The system integrates with both Stripe and PayPal for payment processing and features a modern React frontend with shadcn/ui components.

## Recent Changes (August 2025)
- ✓ Configured GitHub Pages deployment with automated CI/CD workflow
- ✓ Fixed environment variable handling for frontend (import.meta.env)
- ✓ Updated PayPal button API endpoints for consistency
- ✓ Created comprehensive deployment documentation
- ✓ Added environment variable templates and README
- ✓ Optimized for static frontend deployment while maintaining full functionality

# User Preferences

Preferred communication style: Simple, everyday language.

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