# Render.com Environment Variables Setup

**IMPORTANT**: render.yaml environment variables are NOT automatically applied. You must set them manually in the Render dashboard.

## Steps to Fix the Deployment:

### 1. Go to your Render dashboard

- Visit https://dashboard.render.com
- Find your "100ktracker-backend" service
- Click on it to open the service details

### 2. Navigate to Environment Variables

- Click on "Environment" tab in the left sidebar
- Click "Add Environment Variable" for each of the following:

### 3. Add these environment variables:

```
NODE_ENV = production
JWT_SECRET = your-super-secret-jwt-key-here-make-it-long-and-random
DATABASE_PATH = /app/db/database.sqlite
APP_URL = https://100ktracker.netlify.app
```

**For JWT_SECRET**: Generate a long random string. You can use this command:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Deploy the service

- After adding all environment variables, click "Manual Deploy" to redeploy
- OR: Make a small change to your code and push to trigger auto-deploy

## Why this happens:

- Render.com uses render.yaml for service configuration (ports, health checks, etc.)
- But environment variables in render.yaml are NOT automatically applied
- You must set them manually in the dashboard for security reasons

## Expected logs after fix:

```
Environment check:
- NODE_ENV: production
- PORT: 10000
- DATABASE_PATH: /app/db/database.sqlite
- APP_URL: https://100ktracker.netlify.app
- JWT_SECRET: set
```

## What this will fix:

1. ✅ Stop SIGTERM crashes (proper JWT_SECRET will fix auth endpoints)
2. ✅ Use correct database path on mounted disk
3. ✅ Enable production mode
4. ✅ Configure CORS for your frontend domain
