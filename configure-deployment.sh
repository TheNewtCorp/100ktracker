#!/bin/bash

# Deployment Configuration Script for 100K Tracker
# This script helps configure environment variables for production deployment

echo "🚀 100K Tracker Deployment Configuration"
echo "========================================="

# Frontend URL
FRONTEND_URL="https://100ktracker.netlify.app"
# Backend URL  
BACKEND_URL="https://one00ktracker.onrender.com"

echo ""
echo "📍 Your Deployment URLs:"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""

echo "🔧 Environment Variables to Set:"
echo ""

echo "📱 NETLIFY (Frontend) Environment Variables:"
echo "============================================="
echo "Variable: VITE_API_BASE_URL"
echo "Value:    ${BACKEND_URL}/api"
echo ""
echo "Set this in Netlify Dashboard:"
echo "1. Go to Site settings > Environment variables"
echo "2. Add: VITE_API_BASE_URL = ${BACKEND_URL}/api"
echo ""

echo "🖥️  RENDER (Backend) Environment Variables:"
echo "==========================================="
echo "NODE_ENV=production"
echo "PORT=3001"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "DATABASE_PATH=./db/database.sqlite"
echo "APP_URL=${FRONTEND_URL}"
echo ""
echo "Set these in Render Dashboard:"
echo "1. Go to your service > Environment"
echo "2. Add each variable above"
echo "3. Make sure to generate a secure JWT_SECRET"
echo ""

echo "📧 Optional Email Configuration (for user invitations):"
echo "======================================================"
echo "EMAIL_HOST=smtp.gmail.com"
echo "EMAIL_PORT=587"
echo "EMAIL_USER=your-email@gmail.com"
echo "EMAIL_PASSWORD=your-app-password"
echo "EMAIL_FROM=\"100K Tracker <noreply@yourdomain.com>\""
echo ""

echo "🧪 Test Commands:"
echo "================"
echo "Test Backend Health: curl ${BACKEND_URL}/health"
echo "Test Backend Root:   curl ${BACKEND_URL}/"
echo "Test Frontend:       Open ${FRONTEND_URL}"
echo ""

echo "✅ Next Steps:"
echo "=============="
echo "1. Set environment variables in Netlify and Render dashboards"
echo "2. Deploy/redeploy both services"
echo "3. Test the URLs above"
echo "4. Try logging in with admin/password"
echo "5. Check browser network tab for successful API calls"
echo ""

echo "🔗 Quick Links:"
echo "==============="
echo "Netlify Dashboard: https://app.netlify.com/"
echo "Render Dashboard:  https://dashboard.render.com/"
echo ""
