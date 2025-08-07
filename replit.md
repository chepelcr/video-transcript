# Overview

This is a video transcription service application built with a full-stack TypeScript architecture, now optimized for GitHub Pages deployment. The app allows users to submit video URLs for transcription with a freemium pricing model - users get 3 free transcriptions before requiring a paid subscription. The system integrates with both Stripe and PayPal for payment processing and features a modern React frontend with shadcn/ui components.

## Recent Changes (August 2025)
- ✅ **TRANSCRIPTION ARCHITECTURE RESTRUCTURED**: Moved all transcription logic from frontend to backend for security
- ✅ **TWO-STEP TRANSCRIPTION PROCESS**: Implemented validate URL first, then process transcription workflow
- ✅ **VIDEO TITLE EXTRACTION**: Added intelligent title extraction for YouTube, Vimeo, and generic URLs
- ✅ **DASHBOARD ENHANCEMENT**: Updated to display video titles instead of raw URLs in transcription history
- ✅ **STATUS INDICATORS**: Added transcription status badges (processing, completed, failed) in history view
- ✅ **AUTHENTICATION MIDDLEWARE**: Fixed authentication middleware and API endpoints across the application
- ✅ **DOCKER CONTAINERIZATION**: Complete Docker setup with development and production configurations
- ✅ **LOCAL TESTING ENVIRONMENT**: Multi-stage Dockerfile with PostgreSQL database integration
- ✅ **HEALTH CHECK ENDPOINTS**: Added /health endpoint for Docker container monitoring
- ✅ **DEVELOPMENT WORKFLOW**: Hot reloading support with volume mounting for live code changes
- ✅ **DATABASE MANAGEMENT**: Automated PostgreSQL setup with initialization scripts
- ✅ **MAKEFILE COMMANDS**: Simplified Docker operations with make commands for common tasks
- ✅ **COMPREHENSIVE DOCUMENTATION**: Created README.docker.md with setup and troubleshooting guides
- ✅ **AWS RDS MIGRATION**: Successfully migrated from Neon Database to AWS RDS PostgreSQL (August 7, 2025)
- ✅ **DATABASE CREDENTIALS**: Added AWS RDS secrets (DATABASE_URL, USERNAME, PASSWORD, DATABASE_NAME)
- ✅ **SSL CONFIGURATION**: Proper SSL configuration for production AWS RDS connections
- ✅ **DATA PRESERVATION**: Existing user and transcription data preserved during migration

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