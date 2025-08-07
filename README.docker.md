# Docker Setup for VideoScript Backend

This document explains how to run the VideoScript backend using Docker for local development and testing.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Development Setup

```bash
# Copy environment template
cp docker.env.example .env

# Edit .env with your actual values (optional for basic testing)
# At minimum, you may want to set:
# - EMAIL_USER and EMAIL_PASS for email functionality
# - STRIPE_SECRET_KEY and PAYPAL credentials for payment testing

# Start development services
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Production-like Testing

```bash
# Set up environment variables
cp docker.env.example .env
# Edit .env with production-like values

# Build and start production services
docker-compose --profile production up --build

# Or run in background
docker-compose --profile production up -d --build
```

## Available Services

### Development Mode
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432 (postgres/postgres)

### Production Mode
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

## Environment Variables

Copy `docker.env.example` to `.env` and configure:

```bash
# Required for payment testing
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Required for email functionality
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password

# Optional - External transcription service
VITE_PYTHON_API_URL=http://localhost:8000
```

## Database Management

### Access Database
```bash
# Connect to PostgreSQL container
docker exec -it videoscript-postgres-dev psql -U postgres -d videoscript_dev

# Or using external client
# Host: localhost
# Port: 5432
# Database: videoscript_dev
# Username: postgres
# Password: postgres
```

### Run Migrations
```bash
# Run migrations inside backend container
docker exec -it videoscript-backend-dev npm run db:push

# Or from host (if you have Node.js installed)
npm run db:push
```

### Reset Database
```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Remove volume (WARNING: This deletes all data)
docker volume rm videoscript_postgres_dev_data

# Start services (will recreate database)
docker-compose -f docker-compose.dev.yml up
```

## Development Workflow

### Hot Reloading
The development setup includes hot reloading:
- Backend code changes trigger automatic restart
- Database persists between container restarts

### Logs
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs

# View backend logs only
docker-compose -f docker-compose.dev.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Debugging
```bash
# Enter backend container
docker exec -it videoscript-backend-dev sh

# View container status
docker-compose -f docker-compose.dev.yml ps

# Check health status
docker-compose -f docker-compose.dev.yml exec backend curl http://localhost:5000/health
```

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Video Transcription (requires authentication)
```bash
# First login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.accessToken')

# Create transcription
curl -X POST http://localhost:5000/api/transcriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 5000
   lsof -i :5000
   
   # Stop conflicting services or change port in docker-compose.yml
   ```

2. **Database connection failed**
   ```bash
   # Ensure PostgreSQL container is healthy
   docker-compose -f docker-compose.dev.yml ps
   
   # Check PostgreSQL logs
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

3. **Permission errors**
   ```bash
   # Reset file permissions
   sudo chown -R $USER:$USER .
   
   # Rebuild containers
   docker-compose -f docker-compose.dev.yml down
   docker-compose -f docker-compose.dev.yml build --no-cache
   ```

### Clean Restart
```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Remove containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove images (optional)
docker-compose -f docker-compose.dev.yml down --rmi all

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build
```

## Production Deployment

For production deployment, use the production profile:

```bash
# Set production environment variables
export DATABASE_URL="postgresql://user:pass@prod-host:5432/dbname"
export JWT_SECRET="your-production-jwt-secret"
# ... other production variables

# Deploy
docker-compose --profile production up -d --build
```

## Frontend Integration

The backend runs on port 5000. To connect your frontend:

1. Set `VITE_API_BASE_URL=http://localhost:5000` in your frontend environment
2. Ensure CORS is properly configured (already done in this setup)
3. Use the authentication endpoints for login/registration

## Support

For issues with the Docker setup:
1. Check the logs first
2. Verify environment variables
3. Ensure Docker Desktop is running
4. Try a clean restart (see troubleshooting section)