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

## Backend Architecture
- **Server**: Express.js with TypeScript, incorporating request logging middleware and robust error handling.
- **Development Workflow**: Vite dev server integration for hot module replacement.
- **Payment Processing**: Supports both Stripe for subscriptions and PayPal for one-time payments.
- **Session Management**: Express sessions with PostgreSQL session store (`connect-pg-simple`).
- **Transcription Logic**: All transcription logic is moved to the backend for enhanced security.
- **Asynchronous Processing**: Implements an asynchronous transcription system using AWS SQS for queuing, with a secure webhook for receiving processed transcriptions.
- **Video Title Extraction**: Intelligent title extraction for YouTube, Vimeo, and generic URLs.
- **Dockerization**: Comprehensive Docker setup for both development and production environments, including PostgreSQL integration and health check endpoints.

## Data Layer
- **Database**: PostgreSQL, with Drizzle ORM for type-safe operations.
- **Schema Design**: Includes `Users` table for subscription tracking and `Transcriptions` table for storing processing results, including video title and status.
- **Storage Interface**: Abstracted storage layer, with a database implementation for production.
- **Database Provider**: AWS RDS PostgreSQL.

## System Design Choices
- **Two-Step Transcription**: A workflow that first validates the URL, then processes the transcription.
- **Authentication**: Robust authentication middleware and API endpoints with seamless session continuation via automatic access token refresh.
- **Real-Time Updates**: Intelligent polling system with variable intervals (5-10 seconds) for real-time dashboard updates, coupled with a bilingual toast notification system for status changes. Aggressive client-side cache busting ensures fresh data.
- **Multi-language Support**: Comprehensive bilingual support for UI elements, password reset flow, and notifications.
- **Freemium Model Enforcement**: Usage tracking to enforce the 3-free-transcription limit.
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