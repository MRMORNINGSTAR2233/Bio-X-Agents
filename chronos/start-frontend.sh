#!/bin/zsh

# Script to start the Chronos frontend
echo "Starting Chronos Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if .env.local file exists
if [ ! -f .env.local ]; then
  echo "⚠️ .env.local file not found! Creating..."
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
  echo "✅ Created .env.local with API URL: http://localhost:8000"
fi

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
  echo "📦 node_modules not found. Installing dependencies..."
  npm install
fi

# Start the frontend development server
echo "🚀 Starting Next.js development server..."
npm run dev

# Note: The script will stay running until the user stops it with Ctrl+C
