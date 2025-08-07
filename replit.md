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
- ✅ **CUSTOM DOMAIN CONFIGURATION**: Configured GitHub Pages for custom subdomain `video-transcript.jcampos.dev` (August 7, 2025)
- ✅ **BASE PATH CLEANUP**: Removed `/video-transcript` subfolder from all routes and configurations
- ✅ **EMAIL TEMPLATE UPDATE**: Updated password reset emails to use custom domain URLs
- ✅ **BILINGUAL FORGOT PASSWORD**: Complete Spanish and English translation support for password reset flow
- ✅ **DNS DOCUMENTATION**: Created comprehensive DNS configuration guide for custom domain setup
- ✅ **GITHUB PAGES ROUTING FIX**: Fixed URL corruption issue on page reload by updating 404.html and routing logic (August 7, 2025)
- ✅ **CORS CONFIGURATION**: Updated server CORS settings to include custom subdomain
- ✅ **LANGUAGE TOGGLE FIX**: Fixed language switching routing after custom domain migration (August 7, 2025)
- ✅ **FEATURES SECTION UPDATE**: Updated "Why Choose" section to highlight new transcription history functionality
- ✅ **AUTHENTICATION BUG FIX**: Fixed critical authentication issue where users weren't properly logged in after email verification (August 7, 2025)
- ✅ **API RESPONSE PARSING**: Fixed frontend API response handling - now properly parses JSON from Response objects
- ✅ **TRANSCRIPTION API UPDATE**: Updated transcription service to handle new structured error response format with proper 004 error code handling for long videos (3-minute limit)
- ✅ **SERVER ERROR HANDLING**: Updated server to properly pass through specific error messages from transcription service instead of generic failures
- ✅ **AWS SQS ASYNCHRONOUS PROCESSING**: Implemented complete asynchronous transcription system using AWS SQS for queuing (August 7, 2025)
- ✅ **WEBHOOK SECURITY**: Added secure webhook endpoint with TRANSCRIPTION_WEBHOOK_SECRET verification for receiving processed transcriptions
- ✅ **REAL-TIME STATUS TRACKING**: Enhanced frontend with auto-refresh functionality, status badges, and processing indicators in both sidebar and dashboard
- ✅ **TRANSCRIPTION STATUS WORKFLOW**: Implemented pending → processing → completed/failed status tracking with bilingual support
- ✅ **HOME PAGE WORKFLOW FIX**: Updated home page transcription form to use new SQS-based API instead of old synchronous endpoint (August 7, 2025)
- ✅ **USER FLOW CONSISTENCY**: Fixed workflow inconsistency - home page now queues transcriptions via SQS and redirects to dashboard like the rest of the system
- ✅ **TRANSLATION COMPLETION**: Fixed all remaining hardcoded strings - "Get Started" buttons, navigation elements fully translate across desktop/mobile views
- ✅ **DATABASE STORAGE MIGRATION**: Completely resolved database storage issue by switching all transcription routes from MemStorage to AuthStorage (database-backed) (August 7, 2025)
- ✅ **TRANSCRIPTION PERSISTENCE**: Updated transcription creation, retrieval, and webhook endpoints to use proper database persistence
- ✅ **PRE-LOGIN URL PRESERVATION**: Fixed app losing pre-login URL input after authentication by persisting pending video URL in localStorage across page navigation
- ✅ **DASHBOARD REFRESH ERROR FIX**: Fixed null pointer exception when refreshing dashboard - added null safety for transcript substring operations and disabled buttons for processing transcriptions (August 7, 2025)
- ✅ **VIDEO TITLE DISPLAY FIX**: Fixed video title display in transcription history - added proper TypeScript typing and improved API response handling (August 7, 2025)
- ✅ **REFRESH BUTTON TRANSLATIONS**: Added complete Spanish and English translations for refresh button and status indicators in dashboard (August 7, 2025)
- ✅ **TOKEN EXPIRATION FIX**: Implemented automatic access token refresh when 401/403 errors occur - seamless session continuation without user intervention (August 7, 2025)
- ✅ **UI FIELD VISIBILITY**: Fixed dashboard to hide inappropriate fields (duration, words, accuracy) for pending/processing transcriptions
- ✅ **TYPE SAFETY IMPROVEMENTS**: Resolved all TypeScript LSP diagnostics with proper schema alignment and type casting
- ✅ **COMPLETE TRANSCRIPTION FLOW RESTORED**: Fixed critical 500 errors in transcription creation flow (August 7, 2025)
- ✅ **VIDEO TITLE EXTRACTION WORKING**: Successfully extracts real YouTube video titles using oEmbed API (e.g., "Rick Astley - Never Gonna Give You Up (Official Video)")
- ✅ **DATABASE SCHEMA COMPLETION**: Added missing `videoTitle` and `status` columns to transcriptions table with proper TypeScript types
- ✅ **SQL INSERTION FIXED**: Resolved SQL syntax errors in createTranscription method that were causing database insertion failures
- ✅ **END-TO-END VALIDATION**: Complete transcription flow from URL validation to database storage is now fully functional
- ✅ **COPY/DOWNLOAD BUTTONS FIXED**: Fixed visibility and functionality of copy/download buttons in both sidebar and dashboard views (August 7, 2025)
- ✅ **STATUS BADGE CONSISTENCY**: Unified status badge styling across sidebar and dashboard with consistent colors and hover effects
- ✅ **VIDEO DURATION VALIDATION**: Added 5-minute duration limit validation for YouTube and Vimeo videos before transcription processing
- ✅ **TRANSLATION FIXES**: Fixed "words" text localization and removed unwanted .toLowerCase() calls in transcription displays
- ✅ **UI IMPROVEMENTS**: Added video provider icons (YouTube red, Vimeo blue, generic) next to video titles across all transcription views
- ✅ **DURATION DISPLAY FEATURE**: Added video duration display in sidebar history with estimated durations for demonstration (August 7, 2025)
- ✅ **TYPESCRIPT FIXES**: Resolved all LSP diagnostics and type safety issues across transcription components
- ✅ **ICON SIZING FIX**: Fixed inconsistent YouTube icon sizes by adding flex-shrink-0 and standardizing icon dimensions across all views (August 7, 2025)
- ✅ **SIDEBAR CARD REDESIGN**: Restructured sidebar cards to prevent status badge cutoff, moved badges inline with action buttons, and cleaned up layout by removing timestamp clutter (August 7, 2025)
- ✅ **DASHBOARD HISTORY STYLING**: Applied same clean card design from sidebar to dashboard history with status badges inline with action buttons and removed timestamp clutter (August 7, 2025)

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

### External APIs & Queue System
- **Python Transcription Service**: External API endpoint for video transcription processing (configured via VITE_PYTHON_API_URL)
- **AWS SQS Integration**: Message queue system for asynchronous transcription processing with SqsService class handling queue operations
- **Webhook Processing**: Secure webhook endpoint (/api/webhook/transcription-result) for receiving completed transcriptions from external service

### Development Tools
- **Replit Integration**: Development environment detection and runtime error overlay
- **Vite Plugins**: React support, runtime error modal, and cartographer for Replit environment

The architecture follows a separation of concerns with shared TypeScript schemas between frontend and backend, enabling type safety across the full stack. The payment system supports both subscription and one-time payment models, with usage tracking to enforce the freemium limitations.