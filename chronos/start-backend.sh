#!/bin/zsh

# Script to start the Chronos backend services
echo "Starting Chronos Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️ .env file not found! Creating from template..."
  cp .env.template .env
  echo "⚠️ Please edit .env file and add your API keys before continuing."
  echo "   Press Enter to continue anyway or Ctrl+C to stop and edit the file."
  read
fi

# Stop any existing containers to avoid port conflicts
echo "Stopping any existing containers..."
docker-compose down

# Build and start the containers
echo "Building and starting containers..."
docker-compose up --build -d

# Check if containers are running
echo "Checking if containers are running..."
sleep 5
if docker-compose ps | grep -q "api.*Up"; then
  echo "✅ Backend API is running!"
  echo "   - API docs available at: http://localhost:8000/docs"
  echo "   - Neo4j browser available at: http://localhost:7474"
  echo "   - API is accessible at: http://localhost:8000"
else
  echo "❌ Backend API failed to start! Check logs with: docker-compose logs -f api"
fi

echo "\nTo view logs, run: docker-compose logs -f"
echo "To stop the backend, run: docker-compose down"
