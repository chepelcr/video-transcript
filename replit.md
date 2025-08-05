# Overview

This is a video transcription service application built with a full-stack TypeScript architecture, now optimized for GitHub Pages deployment. The app allows users to submit video URLs for transcription with a freemium pricing model - users get 3 free transcriptions before requiring a paid subscription. The system integrates with both Stripe and PayPal for payment processing and features a modern React frontend with shadcn/ui components.

## Recent Changes (August 2025)
- ✅ **FRONTEND-ONLY ARCHITECTURE**: Completely removed backend dependencies for frontend-only testing
- ✅ **MOCK API SERVICES**: Created comprehensive mock API that simulates all backend functionality
- ✅ **COMPLETE SIMULATION**: PayPal, Stripe, transcription, and user management all work with mock data
- ✅ **PAYPAL MOCK**: Simplified PayPal button that demonstrates payment flow without external dependencies
- ✅ **STRIPE MOCK**: Functional Stripe integration simulation for subscription testing
- ✅ **TRANSCRIPTION MOCK**: Video transcription service with realistic processing simulation
- ✅ **USER SIMULATION**: Complete user authentication and subscription status management
- ✅ **VITE FRONTEND**: Pure frontend application running on Vite dev server for easy testing

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

## Backend Architecture (Mock Implementation)
- **Mock API Services**: Complete frontend simulation of all backend functionality in `client/src/services/mockApi.ts`
- **Fetch Interceptor**: Automatic request interception that routes API calls to mock functions
- **Payment Processing**: Simulated PayPal and Stripe payment flows with realistic delays and responses
- **Local Storage**: Mock user data and transcriptions stored in memory for testing purposes

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