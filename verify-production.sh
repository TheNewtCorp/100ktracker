#!/bin/bash

# Production Environment Verification Script
echo "🔧 Production Environment Verification"
echo "======================================"

FRONTEND_URL="https://100ktracker.netlify.app"
BACKEND_URL="https://one00ktracker.onrender.com"

echo ""
echo "1. Checking Frontend Environment:"
echo "================================="
echo "Opening frontend in browser to check environment variables..."
echo "Look for these in the browser console:"
echo "  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)"

echo ""
echo "2. Backend Environment Check:"
echo "============================="
echo "Checking backend environment endpoint..."
response=$(curl -s "${BACKEND_URL}/api/env-check" || echo "endpoint not available")
echo "Response: $response"

echo ""
echo "3. Database Status:"
echo "=================="
echo "Checking if database is accessible..."
response=$(curl -s "${BACKEND_URL}/api/db-status" || echo "endpoint not available")
echo "Response: $response"

echo ""
echo "4. JWT Configuration:"
echo "===================="
echo "Testing if JWT_SECRET is properly configured..."
test_response=$(curl -s -X POST "${BACKEND_URL}/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' || echo "login failed")

if [[ $test_response == *"token"* ]]; then
    echo "✅ JWT configuration appears correct"
else
    echo "❌ JWT configuration issue detected"
    echo "Response: $test_response"
fi

echo ""
echo "5. Deployment Health Check:"
echo "=========================="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Quick tests:"
echo "- Frontend loading: $(curl -s -o /dev/null -w '%{http_code}' $FRONTEND_URL)"
echo "- Backend health: $(curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/health)"
echo "- API status: $(curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/login)"

echo ""
echo "Troubleshooting Steps:"
echo "====================="
echo "If login fails:"
echo "1. Check Render logs: https://dashboard.render.com"
echo "2. Verify JWT_SECRET is set in Render environment"
echo "3. Check database initialization in logs"
echo ""
echo "If CORS errors occur:"
echo "1. Verify APP_URL environment variable in Render"
echo "2. Check browser network tab for preflight requests"
echo "3. Clear browser cache and cookies"
echo ""
echo "If database errors:"
echo "1. Check if persistent disk is properly mounted"
echo "2. Verify DATABASE_PATH environment variable"
echo "3. Check file permissions in Render logs"
