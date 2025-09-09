#!/bin/bash

# Script to test Docker deployment locally
echo "🐳 Testing Docker deployment locally..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t 100ktracker-backend .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Run the container
echo "🚀 Starting container..."
docker run -d \
    --name 100ktracker-test \
    -p 3001:3001 \
    -e NODE_ENV=production \
    -e PORT=3001 \
    -e JWT_SECRET=test-secret \
    -e DATABASE_PATH=/app/db/database.sqlite \
    -e APP_URL=http://localhost:5173 \
    -v $(pwd)/db:/app/db \
    100ktracker-backend

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

# Wait for the service to start
echo "⏳ Waiting for service to start..."
sleep 10

# Test the health endpoint
echo "🏥 Testing health endpoint..."
response=$(curl -s -w "%{http_code}" http://localhost:3001/health)
http_code=${response: -3}

if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed!"
    echo "🌐 Backend is running at: http://localhost:3001"
    echo "📊 Health endpoint: http://localhost:3001/health"
    echo "🏠 Main endpoint: http://localhost:3001/"
else
    echo "❌ Health check failed! HTTP code: $http_code"
    echo "📋 Container logs:"
    docker logs 100ktracker-test
fi

echo ""
echo "🛑 To stop the test container, run:"
echo "   docker stop 100ktracker-test"
echo "   docker rm 100ktracker-test"
