# Overview

This project is a video transcription service application built with a full-stack TypeScript architecture. It enables users to submit video URLs for transcription and operates on a freemium model, offering 3 free transcriptions before requiring a paid subscription. The application integrates with Stripe and PayPal for payment processing and features a modern React frontend. Authentication is fully managed by AWS Cognito, with no local password storage for enhanced security. The primary goal is to provide an efficient and reliable video transcription solution, prioritizing user experience and flexible deployment, with ambitions for market potential as a streamlined and reliable service.

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Prefers flag icons over text indicators for language selection in navigation. Prefers compact, well-aligned interface elements with proper spacing. Flags should be aligned to the right side of dropdown menus to match navbar icon alignment.

# Recent Changes

API Endpoint Structure Fix: ✅ COMPLETED - August 11, 2025 - Fixed transcription API endpoint malformation by updating frontend to use existing backend routes instead of creating new endpoints. Updated all frontend API calls from `/api/transcriptions/create` to `/api/users/{userId}/transcriptions` to match existing backend controller structure. Modified dashboard, video transcription form, and sidebar components to use user-specific endpoints. Updated query keys and cache invalidation to use proper user-scoped structure. All transcription endpoints now correctly include `/api/` prefix and follow domain-style URL pattern for complete user isolation.

Swagger Documentation Consistency Fix: ✅ COMPLETED - August 11, 2025 - Updated all Swagger documentation across all controllers to include proper `/api/` prefix for consistent API documentation. Fixed TranscriptionController paths from `/users/{userId}/transcriptions` to `/api/users/{userId}/transcriptions` and HealthController paths from `/health`, `/ping`, `/readiness`, `/liveness` to include `/api/` prefix. All API documentation now accurately reflects the actual mounted endpoints. Swagger UI now displays correct URLs that match the real API structure for seamless frontend-backend integration.

# System Architecture

## Frontend Architecture
- **Technology Stack**: React with TypeScript, using Vite.
- **UI/UX**: `shadcn/ui` components built on Radix UI primitives, styled with Tailwind CSS.
- **Routing**: Client-side routing handled by Wouter.
- **State Management**: TanStack Query for server state and local storage hooks for client state.
- **Forms**: React Hook Form with Zod validation.
- **Payment UI**: Integrates Stripe Elements and a custom PayPal button.
- **User Authentication**: Integrated with AWS Amplify for registration, login, password reset, and email verification.

## Backend Architecture - Modern Controller-Based Design
- **Server Framework**: Express.js with TypeScript, organized into a controller-only architecture.
- **Directory Structure**: Enterprise patterns with `config/`, `models/`, `repositories/`, `services/`, `controllers/`, `middlewares/`, `types/`.
- **Controllers**: AuthController, TranscriptionController, PaymentController, UserController, and HealthController with embedded routing.
- **AWS API Gateway Compatible**: Relies on external AWS API Gateway authorization via `x-user-id` headers, with no internal JWT validation.
- **API Documentation System**: FastAPI-style Swagger documentation with auto-generated OpenAPI 3.0 spec.
- **Dependency Injection**: Centralized dependency container.
- **Payment Processing**: Integration with dedicated PaymentController for Stripe subscriptions and PayPal one-time payments.
- **Session Management**: Express sessions with PostgreSQL session store.
- **Transcription Logic**: All transcription logic resides in backend services.
- **Asynchronous Processing**: AWS SQS-based queuing system with complete SQS message processing (no webhooks).
- **Video Title Extraction**: Intelligent title extraction service for YouTube, Vimeo, and generic URLs.
- **Security Enhancement**: All password management removed from backend - fully delegated to AWS Cognito for enhanced security.
- **Dockerization**: Multi-stage Docker setup supporting development, production, and AWS Lambda deployments.

## Data Layer
- **Database**: PostgreSQL, utilizing Drizzle ORM for type-safe operations.
- **Schema Design**: Includes `Users` for subscription tracking and `Transcriptions` for storing processing results (including video title and status).
- **Storage Interface**: Abstracted storage layer with authentication methods removed.
- **Database Provider**: AWS RDS PostgreSQL.
- **Security**: Password and email verification fields removed from database schema - handled entirely by AWS Cognito.

## System Design Choices
- **Two-Step Transcription**: URL validation followed by transcription processing.
- **Authentication**: JWT-based authentication with refresh token support, managed by AWS Amplify on the frontend and synchronized with backend via Cognito user IDs. Zero local password storage.
- **Real-Time Updates**: Intelligent polling system for dashboard updates, coupled with bilingual toast notifications.
- **Multi-language Support**: Comprehensive bilingual support for UI elements and notifications.
- **Freemium Model Enforcement**: Usage tracking at the service layer enforces the 3-free-transcription limit.
- **Enterprise Architecture**: Follows layered architecture with separation of concerns, dependency injection, and comprehensive error handling.
- **Security Architecture**: Complete delegation of authentication to AWS Cognito.
- **Deployment**: Multi-deployment support including GitHub Pages (static frontend), traditional Docker containers, and AWS Lambda (serverless backend).

# External Dependencies

### Payment Providers
- **Stripe**: For subscription management, payment intents, and customer billing.
- **PayPal**: For alternative one-time payment options, utilizing the PayPal Server SDK.

### Database & Infrastructure
- **AWS RDS PostgreSQL**: For managed PostgreSQL database hosting.
- **Drizzle ORM**: For type-safe database queries.
- **AWS Amplify**: For frontend user authentication and authorization.
- **AWS Cognito**: For user creation and management.

### External APIs & Queue System
- **Python Transcription Service**: An external API endpoint for video transcription processing.
- **AWS SQS**: For asynchronous message queuing to manage transcription requests.
- **oEmbed API**: Used for extracting real YouTube video titles.