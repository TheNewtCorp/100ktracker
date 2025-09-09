@echo off
echo 🐳 Testing Docker deployment from root directory...

REM Build the Docker image from root
echo 📦 Building Docker image from root directory...
docker build -t 100ktracker-backend .

if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    exit /b 1
)

REM Run the container
echo 🚀 Starting container...
docker run -d --name 100ktracker-test -p 3001:3001 -e NODE_ENV=production -e PORT=3001 -e JWT_SECRET=test-secret -e DATABASE_PATH=/app/db/database.sqlite -e APP_URL=http://localhost:5173 -v "%cd%/test-db:/app/db" 100ktracker-backend

if %errorlevel% neq 0 (
    echo ❌ Failed to start container!
    exit /b 1
)

REM Wait for the service to start
echo ⏳ Waiting for service to start...
timeout /t 15 /nobreak

REM Test the health endpoint
echo 🏥 Testing health endpoint...
curl -s http://localhost:3001/health

echo.
echo 🧪 Testing main endpoint...
curl -s http://localhost:3001/

echo.
echo ✅ Docker test completed!
echo 🌐 Backend is running at: http://localhost:3001
echo 📊 Health endpoint: http://localhost:3001/health
echo 🏠 Main endpoint: http://localhost:3001/
echo.
echo 🛑 To stop the test container, run:
echo    docker stop 100ktracker-test
echo    docker rm 100ktracker-test
echo    docker rmi 100ktracker-backend
