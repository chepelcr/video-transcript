# Multi-stage build for Node.js backend with AWS Lambda support
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start development server
CMD ["npm", "run", "dev"]

# Production builder
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage (Traditional Docker deployment)
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "dist/server/index.js"]

# AWS Lambda stage (optimized for Lambda runtime)
FROM public.ecr.aws/lambda/nodejs:20 AS lambda

# Copy built application from builder stage
COPY --from=builder ${LAMBDA_TASK_ROOT}/dist ./dist
COPY --from=builder ${LAMBDA_TASK_ROOT}/node_modules ./node_modules
COPY --from=builder ${LAMBDA_TASK_ROOT}/package*.json ./

# Lambda-specific configuration
ENV NODE_ENV=production
ENV AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-instrument

# Set the Lambda handler
CMD ["dist/server/lambda.handler"]