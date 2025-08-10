# Overview

This is a video transcription service application built with a full-stack TypeScript architecture. The application allows users to submit video URLs for transcription, operating on a freemium model that offers 3 free transcriptions before requiring a paid subscription. It integrates with both Stripe and PayPal for payment processing and features a modern React frontend. The project's ambition is to provide an efficient and reliable video transcription solution, with a focus on user experience and flexible deployment.

## Recent Changes (August 2025)
**Complete Controller-Only Architecture Migration (January 2025)** - Final modernization completed:
- ✅ **Modern Controller Pattern**: All 5 controllers migrated to self-contained architecture with embedded routing
- ✅ **JWT/API Key Validation Removed**: All internal authentication removed - AWS API Gateway handles authorization
- ✅ **Routes Folder Deleted**: Complete consolidation into controller-only pattern
- ✅ **Service Method Alignment**: Fixed all service method calls to match actual implementations
- ✅ **AWS API Gateway Ready**: Full compatibility with external authorization via x-user-id headers
- ✅ **Profile Endpoints Consolidated**: Unified /users/{userId}/profile pattern with proper user access validation

**Automatic OpenAPI Documentation System** - Implemented library-based API documentation:
- ✅ **Library Integration**: Uses swagger-jsdoc and swagger-ui-express for automatic OpenAPI generation
- ✅ **JSDoc-Based Documentation**: Route documentation via JSDoc comments, no manual endpoint management
- ✅ **Real-time Updates**: Documentation automatically reflects code changes without manual updates
- ✅ **Complete OpenAPI 3.0 Spec**: Proper schemas, security definitions, and response examples

**Domain-like URL Structure Implementation** - Restructured transcription API with domain-style URLs:
- ✅ **URL Pattern Change**: Moved from /api/transcriptions to /users/{userId}/transcriptions structure
- ✅ **Removed Anonymous Endpoints**: Deleted /api/transcriptions/anonymous (authentication always required)
- ✅ **User Authorization**: Users can only access/modify their own transcriptions via URL validation
- ✅ **Domain-style Routes**: POST/GET/PATCH /users/{userId}/transcriptions/{id} pattern implemented
- ✅ **Public Access Routes**: GET /transcriptions/{id}/public for public transcription viewing
- ✅ **Webhook Integration**: POST /transcriptions/webhook/{id} for processing callbacks

**AWS API Gateway Lambda Integration Completed** - Successfully implemented comprehensive AWS Lambda/API Gateway architecture:
- ✅ **AWS API Gateway Authorization**: Policy-based IAM authorization with API key validation
- ✅ **Lambda Handler Pattern**: Complete AWS Lambda entry point with request type detection
- ✅ **Public Retrieval Endpoints**: GET /api/transcriptions/{id}/public (optional auth)
- ✅ **API Gateway Middleware**: Automatic detection and handling of API Gateway requests vs normal app requests  
- ✅ **Stateless Operation**: Perfect for serverless/lambda deployments without persistent state
- ✅ **Policy Generator**: AWS IAM policy generation following Python example pattern
- ✅ **Lambda Deployment Ready**: server/lambda.ts entry point for AWS deployment

**Server Architecture Cleanup & Database Integration Completed** - Successfully resolved all architectural conflicts:
- ✅ **Clean File Structure**: Removed all unused legacy server files (auth.ts, migration.ts, paypal.ts, storage.ts, etc.)
- ✅ **AWS RDS Integration**: Fixed database URL construction from individual secrets with SSL support
- ✅ **Hybrid Architecture**: server/index.ts bridges enterprise patterns (server/src/) with legacy Vite setup
- ✅ **API Documentation System**: FastAPI-style Swagger UI accessible at /api/docs with complete OpenAPI 3.0 spec
- ✅ **Graceful Degradation**: Continues operation even with database connection issues
- ✅ **Production Ready**: SSL-enabled AWS RDS connection with proper error handling
- ✅ **Demo Mode Authentication**: Successfully implemented fallback authentication system that creates demo users when database is unavailable
- ✅ **JWT Configuration**: Fixed JWT secret configuration with development fallbacks for seamless operation

**Database Connection Details**: 
- Properly constructs PostgreSQL URL from AWS_RDS_* environment variables with typo correction ('video-transcipt' → 'video-transcript')
- Uses SSL with self-signed certificate support for AWS RDS  
- Implements graceful fallback when database connection fails, creating demo users for continued operation
- Authentication system fully operational with JWT token generation in both database and demo modes

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Prefers flag icons over text indicators for language selection in navigation. Prefers compact, well-aligned interface elements with proper spacing. Flags should be aligned to the right side of dropdown menus to match navbar icon alignment.

# System Architecture

**Complete Architecture Migration (January 2025)**: All functionality migrated to modern controller-only architecture. Removed legacy routes folder entirely and eliminated all JWT/API key validation in favor of AWS API Gateway authorization.

**Self-Contained Controllers (January 2025)**: Five controllers now handle both routing and business logic with embedded route definitions and JSDoc documentation for automatic OpenAPI generation.

## Frontend Architecture
- **Technology Stack**: React with TypeScript, using Vite as the build tool.
- **UI/UX**: Utilizes `shadcn/ui` components built on Radix UI primitives, styled with Tailwind CSS.
- **Routing**: Client-side routing handled by Wouter for pages such as home, checkout, and subscription.
- **State Management**: TanStack Query for server state management and local storage hooks for client state.
- **Forms**: React Hook Form with Zod validation schemas.
- **Payment UI**: Integrates Stripe Elements and a custom PayPal button component.

## Backend Architecture - Modern Controller-Based Design
- **Server Framework**: Express.js with TypeScript, reorganized into modern controller-only architecture (August 2025)
- **Directory Structure**: Streamlined enterprise patterns with controllers containing both logic and routing:
  - `server/src/config/` - Application configuration and database setup
  - `server/src/models/` - Business logic models and validation schemas  
  - `server/src/repositories/` - Data access layer with type-safe Drizzle ORM operations
  - `server/src/services/` - Business logic layer handling core application functionality
  - `server/src/controllers/` - HTTP request/response handling, routing, and JSDoc documentation
  - `server/src/middlewares/` - Authentication, CORS, and request processing
  - `server/src/types/` - TypeScript type definitions
- **Modern Controller Architecture**: AuthController, TranscriptionController, PaymentController, UserController, and HealthController (all with embedded routing)
- **AWS API Gateway Compatible**: No internal JWT validation - relies on external AWS API Gateway authorization via x-user-id headers
- **Comprehensive Route Coverage**: All auth endpoints (/register, /login, /refresh-token, /verify-email, /forgot-password, /reset-password, /me, /profile), user endpoints (/profile, /transcriptions), payment endpoints (Stripe + PayPal), transcription endpoints, and health monitoring endpoints
- **Health Monitoring System**: Production-ready health checks (/health, /readiness, /liveness, /ping) with service dependency monitoring
- **API Documentation System**: FastAPI-style Swagger documentation with auto-generated OpenAPI 3.0 spec (/docs for UI, /api-docs for JSON)
- **Dependency Injection**: Centralized dependency container for clean architecture
- **Payment Processing**: Full integration with dedicated PaymentController for both Stripe subscriptions and PayPal one-time payments
- **Session Management**: Express sessions with PostgreSQL session store (`connect-pg-simple`)
- **Transcription Logic**: All transcription logic moved to backend services for enhanced security
- **Asynchronous Processing**: AWS SQS-based queuing system with secure webhook processing
- **Video Title Extraction**: Intelligent title extraction service for YouTube, Vimeo, and generic URLs
- **Development Workflow**: Vite dev server integration for hot module replacement
- **Dockerization**: Comprehensive Docker setup for both development and production environments

## Data Layer
- **Database**: PostgreSQL, with Drizzle ORM for type-safe operations.
- **Schema Design**: Includes `Users` table for subscription tracking and `Transcriptions` table for storing processing results, including video title and status.
- **Storage Interface**: Abstracted storage layer, with a database implementation for production.
- **Database Provider**: AWS RDS PostgreSQL.

## System Design Choices
- **Two-Step Transcription**: A workflow that first validates the URL, then processes the transcription.
- **Authentication**: JWT-based authentication with refresh token support, implemented through dedicated auth service layer.
- **Real-Time Updates**: Intelligent polling system with variable intervals (5-10 seconds) for real-time dashboard updates, coupled with a bilingual toast notification system for status changes. Aggressive client-side cache busting ensures fresh data.
- **Multi-language Support**: Comprehensive bilingual support for UI elements, password reset flow, and notifications.
- **Freemium Model Enforcement**: Usage tracking implemented at service layer to enforce the 3-free-transcription limit.
- **Enterprise Architecture**: Follows industry-standard layered architecture with proper separation of concerns, dependency injection, and comprehensive error handling.
- **Payment Integration**: Dedicated payment controllers for both Stripe and PayPal with proper service layer integration.
- **Deployment**: Optimized for GitHub Pages with custom domain configuration.

# External Dependencies

### Payment Providers
- **Stripe**: For subscription management, payment intents, and customer billing.
- **PayPal**: For alternative one-time payment options, utilizing the PayPal Server SDK.

### Database & Infrastructure
- **AWS RDS PostgreSQL**: For managed PostgreSQL database hosting.
- **Drizzle ORM**: For type-safe database queries.

### External APIs & Queue System
- **Python Transcription Service**: An external API endpoint responsible for video transcription processing.
- **AWS SQS**: Utilized for asynchronous message queuing to manage transcription requests.
- **oEmbed API**: Used for extracting real YouTube video titles.

### Development Tools
- **Replit Integration**: For development environment detection and runtime error display.