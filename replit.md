# Overview

This project is a video transcription service application built with a full-stack TypeScript architecture. It enables users to submit video URLs for transcription and operates on a freemium model, offering 3 free transcriptions before requiring a paid subscription. The application integrates with Stripe and PayPal for payment processing and features a modern React frontend. Authentication is fully managed by AWS Cognito, with no local password storage for enhanced security. The primary goal is to provide an efficient and reliable video transcription solution, prioritizing user experience and flexible deployment.

# User Preferences

Preferred communication style: Simple, everyday language.
UI Design: Prefers flag icons over text indicators for language selection in navigation. Prefers compact, well-aligned interface elements with proper spacing. Flags should be aligned to the right side of dropdown menus to match navbar icon alignment.
Authentication Architecture: ✅ FIXED - Auto-sync functionality now working perfectly. Users created in AWS Cognito are automatically synced to backend database when they attempt login. System fetches complete user data from Cognito (name, email, user ID) and creates database records seamlessly. AWS IAM permission `cognito-idp:AdminGetUser` required for Cognito integration.
Dashboard Architecture: ✅ FIXED - August 11, 2025 - Transcription dashboard fully operational with complete data retrieval. Service layer properly returns structured response with transcriptions array and total count. All backend layers (controller, service, repository) functioning correctly with AWS RDS PostgreSQL.
GitHub Pages Deployment: ✅ UPDATED - August 11, 2025 - Added AWS Cognito environment variables (VITE_AWS_COGNITO_USER_POOL_ID, VITE_AWS_COGNITO_CLIENT_ID) to GitHub Actions workflow for proper authentication in production deployment. Updated deployment documentation with required repository secrets setup.
Lambda Deployment: ✅ ENHANCED - August 11, 2025 - Completed comprehensive AWS Lambda handler supporting three event types: authorization requests (API Gateway authorizer with API key validation), API requests (Express app integration), and SQS message processing (transcription requests, completion notifications, email sending, user sync). Added multi-stage Docker build, serverless-http integration, and complete deployment documentation with test examples.
AWS Secrets Manager: ✅ IMPLEMENTED - August 11, 2025 - Migrated from environment variables to AWS Secrets Manager for enhanced security. Database credentials stored in `dev/video-transcript/db` secret, SMTP credentials in `dev/FrontEnd/ses` secret. All repositories and services updated with async database connections. Email service updated with AWS Secrets fallback. Reduced environment variable requirements significantly.
Footer Social Media: ✅ UPDATED - August 11, 2025 - Fixed missing social media icons in footer. Replaced placeholder text with proper SVG icons and added real links to LinkedIn (jose-pablo-campos) and GitHub (chepelcr). Removed Twitter icon per user preference.
Welcome Email System: ✅ IMPLEMENTED - August 11, 2025 - Created comprehensive welcome email and notification system for new user registration. Features beautiful HTML email template with AWS SES integration, welcome dashboard notification, and automatic triggering during both auto-sync and normal registration flows. System uses AWS Secrets Manager for SMTP credentials with environment variable fallback.
Bilingual Logout Notifications: ✅ FIXED - August 11, 2025 - Implemented bilingual toast notifications for logout functionality. Added auth.logout.title and auth.logout.description translations in both English and Spanish. Updated handleLogout functions in dashboard.tsx and home.tsx to use t() translation function instead of hardcoded English messages. System now shows "Signed Out" / "Sesión Cerrada" based on user's selected language.
Email Template & Free Tier Fixes: ✅ FIXED - August 11, 2025 - Fixed email text justification by adding text-align: justify to all welcome email paragraphs. Updated free tier messaging from "free transcriptions remaining" to "transcriptions per day (free tier)" to correctly reflect the 3-per-day limit. Updated both English and Spanish translations and email templates to show accurate free tier offering. Fixed email button URLs: welcome email buttons now route to correct language pages (/en/ vs /es/) based on user preference.
Welcome Email Workflow: ✅ ENHANCED - August 11, 2025 - Improved authentication security by removing public endpoints and ensuring all user data stays in Cognito until after verification. Fixed verification completion flow: users register → store all data in Cognito → verify email → backend syncs user from Cognito to database → sends welcome materials. Authentication properly enforced with API Gateway middleware ensuring users can only complete verification for their own accounts. System maintains secure approach while providing seamless user experience.
API Architecture & Documentation: ✅ COMPLETED - August 11, 2025 - Successfully migrated from auth-centric to user-centric API routing. Deleted AuthController and consolidated all user-related functionality into UserController. Updated endpoints: /api/users POST for registration, /api/users/{userId}/verify-email-complete for verification completion (no request body needed - retrieves email from userId, language parameter for internationalization). All frontend hooks and API calls updated to use new routing structure. Enhanced security: all endpoints properly secured with API Gateway middleware preventing unauthorized access. Comprehensive Swagger documentation cleanup: removed redundant x-user-id headers (user information already in URL paths), added ApiGatewayAuth security scheme, updated all endpoint documentation with proper security requirements and examples.

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
- **Directory Structure**: Enterprise patterns with controllers containing both logic and routing: `config/`, `models/`, `repositories/`, `services/`, `controllers/`, `middlewares/`, `types/`.
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
- **Dockerization**: Multi-stage Docker setup supporting development, production, and AWS Lambda deployments with optimized container configurations.

## Data Layer
- **Database**: PostgreSQL, utilizing Drizzle ORM for type-safe operations.
- **Schema Design**: Includes `Users` for subscription tracking (no password storage) and `Transcriptions` for storing processing results (including video title and status).
- **Storage Interface**: Abstracted storage layer with authentication methods removed.
- **Database Provider**: AWS RDS PostgreSQL.
- **Security**: Password and email verification fields removed from database schema - handled entirely by AWS Cognito.

## System Design Choices
- **Two-Step Transcription**: URL validation followed by transcription processing.
- **Authentication**: JWT-based authentication with refresh token support, managed by AWS Amplify on the frontend and synchronized with backend via Cognito user IDs. Zero local password storage for enhanced security.
- **Real-Time Updates**: Intelligent polling system for dashboard updates, coupled with bilingual toast notifications.
- **Multi-language Support**: Comprehensive bilingual support for UI elements and notifications.
- **Freemium Model Enforcement**: Usage tracking at the service layer enforces the 3-free-transcription limit.
- **Enterprise Architecture**: Follows layered architecture with separation of concerns, dependency injection, and comprehensive error handling.
- **Security Architecture**: Complete delegation of authentication to AWS Cognito - no passwords, verification codes, or refresh tokens stored locally.
- **Deployment**: Multi-deployment support including GitHub Pages (static frontend), traditional Docker containers, and AWS Lambda (serverless backend) with comprehensive documentation and Docker Compose configurations.

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