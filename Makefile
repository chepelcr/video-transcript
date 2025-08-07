# VideoScript Backend Docker Commands
.PHONY: help dev prod stop clean logs db-connect test build

# Default target
help:
	@echo "VideoScript Backend Docker Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev      - Start development environment with hot reload"
	@echo "  make logs     - View development logs"
	@echo "  make stop     - Stop all services"
	@echo ""
	@echo "Production:"
	@echo "  make prod     - Start production environment"
	@echo "  make build    - Build production images"
	@echo ""
	@echo "Database:"
	@echo "  make db-connect  - Connect to PostgreSQL database"
	@echo "  make db-reset    - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean    - Clean up containers and images"
	@echo "  make test     - Test API endpoints"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up

dev-build:
	@echo "Building and starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-bg:
	@echo "Starting development environment in background..."
	docker-compose -f docker-compose.dev.yml up -d

# Production environment  
prod:
	@echo "Starting production environment..."
	docker-compose --profile production up --build

prod-bg:
	@echo "Starting production environment in background..."
	docker-compose --profile production up -d --build

# Build only
build:
	@echo "Building Docker images..."
	docker-compose build

# Stop services
stop:
	@echo "Stopping all services..."
	docker-compose -f docker-compose.dev.yml down
	docker-compose --profile production down

# View logs
logs:
	docker-compose -f docker-compose.dev.yml logs

logs-follow:
	docker-compose -f docker-compose.dev.yml logs -f

logs-backend:
	docker-compose -f docker-compose.dev.yml logs backend

# Database operations
db-connect:
	@echo "Connecting to PostgreSQL database..."
	docker exec -it videoscript-postgres-dev psql -U postgres -d videoscript_dev

db-reset:
	@echo "WARNING: This will delete all database data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f docker-compose.dev.yml down
	docker volume rm videoscript_postgres_dev_data || true
	docker-compose -f docker-compose.dev.yml up -d

# Testing
test:
	@echo "Testing API endpoints..."
	@echo "Health check:"
	@curl -f http://localhost:5000/health || echo "Backend not running"
	@echo ""
	@echo "API status:"
	@curl -f http://localhost:5000/api/auth/status || echo "Auth endpoint not available"

# Clean up
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose --profile production down -v
	docker system prune -f

clean-all:
	@echo "WARNING: This will remove ALL Docker resources!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker-compose --profile production down -v --rmi all
	docker system prune -af

# Status check
status:
	@echo "Docker Compose Services:"
	docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "Docker Containers:"
	docker ps | grep videoscript || echo "No VideoScript containers running"