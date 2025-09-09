#!/bin/bash

echo "🧪 Testing Crash Fixes Locally"
echo "==============================="

cd backend

# Set test environment variables
export NODE_ENV=production
export JWT_SECRET=test-jwt-secret-for-local-testing
export DATABASE_PATH=./test-db/database.sqlite
export APP_URL=https://100ktracker.netlify.app

echo ""
echo "Environment variables set:"
echo "- NODE_ENV: $NODE_ENV"
echo "- JWT_SECRET: set"
echo "- DATABASE_PATH: $DATABASE_PATH" 
echo "- APP_URL: $APP_URL"

echo ""
echo "Starting server (press Ctrl+C to stop)..."
echo "Watch for:"
echo "1. Single database initialization (not duplicate)"
echo "2. Correct environment values in logs"
echo "3. No crashes after 1 minute"

npm start
