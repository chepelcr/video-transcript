# Overview

This is a video transcription service application built with a full-stack TypeScript architecture. The application allows users to submit video URLs for transcription, operating on a freemium model that offers 3 free transcriptions before requiring a paid subscription. It integrates with both Stripe and PayPal for payment processing and features a modern React frontend. The project's ambition is to provide an efficient and reliable video transcription solution, with a focus on user experience and flexible deployment.

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Prefers flag icons over text indicators for language selection in navigation. Prefers compact, well-aligned interface elements with proper spacing. Flags should be aligned to the right side of dropdown menus to match navbar icon alignment.

# System Architecture

## Frontend Architecture
- **Technology Stack**: React with TypeScript, using Vite as the build tool.
- **UI/UX**: Utilizes `shadcn/ui` components built on Radix UI primitives, styled with Tailwind CSS.
- **Routing**: Client-side routing handled by Wouter for pages such as home, checkout, and subscription.
- **State Management**: TanStack Query for server state management and local storage hooks for client state.
- **Forms**: React Hook Form with Zod validation schemas.
- **Payment UI**: Integrates Stripe Elements and a custom PayPal button component.

## Backend Architecture - Industry Standard Layered Design
- **Server Framework**: Express.js with TypeScript, fully reorganized into industry-standard layered architecture (August 2025)
- **Directory Structure**: Complete enterprise-level patterns with clear separation of concerns:
  - `server/src/config/` - Application configuration and database setup
  - `server/src/models/` - Business logic models and validation schemas  
  - `server/src/repositories/` - Data access layer with type-safe Drizzle ORM operations
  - `server/src/services/` - Business logic layer handling core application functionality
  - `server/src/controllers/` - HTTP request/response handling and validation
  - `server/src/middlewares/` - Authentication, CORS, and request processing
  - `server/src/routes/` - RESTful API route definitions
  - `server/src/types/` - TypeScript type definitions
- **Complete Controller Architecture**: AuthController, TranscriptionController, PaymentController, and UserController
- **Comprehensive Route Coverage**: All auth endpoints (/register, /login, /refresh-token, /verify-email, /forgot-password, /reset-password, /me, /profile), user endpoints (/profile, /transcriptions), payment endpoints (Stripe + PayPal), and transcription endpoints
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