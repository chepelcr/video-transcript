-- Initialize VideoScript database
-- This file will be executed when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database (if not exists - this is mainly for documentation)
-- The database is already created via POSTGRES_DB environment variable

-- Set up proper permissions
GRANT ALL PRIVILEGES ON DATABASE videoscript_dev TO postgres;

-- You can add any initial data or schema setup here
-- Note: Drizzle migrations will handle the actual table creation