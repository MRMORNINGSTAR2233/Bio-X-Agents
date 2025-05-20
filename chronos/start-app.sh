#!/bin/zsh

# Script to start the entire Chronos application (backend and frontend)
echo "Starting Chronos Application..."

# Get the directory where this script is located
SCRIPT_DIR="$(dirname "$0")"

# Start the backend in the background
echo "Starting backend services..."
zsh "$SCRIPT_DIR/start-backend.sh"
echo ""

# Check if backend is up before starting frontend
echo "Waiting for backend to be ready..."
MAX_TRIES=30
COUNT=0
BACKEND_UP=false

while [ $COUNT -lt $MAX_TRIES ]; do
  if curl -s http://localhost:8000 > /dev/null; then
    BACKEND_UP=true
    break
  fi
  echo "Waiting for backend... ($(($COUNT+1))/$MAX_TRIES)"
  sleep 2
  COUNT=$((COUNT+1))
done

if [ "$BACKEND_UP" = true ]; then
  echo "✅ Backend is up and running!"
  
  # Start the frontend
  echo ""
  echo "Starting frontend..."
  zsh "$SCRIPT_DIR/start-frontend.sh"
else
  echo "❌ Backend failed to start within the timeout period."
  echo "Please check the backend logs with: docker-compose -f $SCRIPT_DIR/backend/docker-compose.yml logs -f"
  exit 1
fi
