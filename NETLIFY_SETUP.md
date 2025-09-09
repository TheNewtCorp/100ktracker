# Quick Setup Commands for Netlify

## After deploying your backend to Render, use these commands to set up Netlify:

### 1. Install Netlify CLI (if not already installed)

```bash
npm install -g netlify-cli
```

### 2. Login to Netlify

```bash
netlify login
```

### 3. Initialize your site (in the root directory of your project)

```bash
netlify init
```

### 4. Set environment variable (replace with your actual backend URL)

```bash
netlify env:set VITE_API_BASE_URL "https://your-backend-name.onrender.com/api"
```

### 5. Deploy manually (optional - will auto-deploy when you push to git)

```bash
netlify deploy --prod
```

## Alternative: Set Environment Variables in Netlify Dashboard

1. Go to your site in Netlify dashboard
2. Navigate to Site settings > Environment variables
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-name.onrender.com/api`

## Environment Variables You Need to Set:

### On Render (Backend):

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-here
DATABASE_PATH=./db/database.sqlite
APP_URL=https://your-frontend-name.netlify.app
```

### On Netlify (Frontend):

```
VITE_API_BASE_URL=https://your-backend-name.onrender.com/api
```

## Test Your Deployment:

1. **Backend Health Check**: Visit `https://your-backend-name.onrender.com/health`
2. **Frontend**: Visit `https://your-frontend-name.netlify.app`
3. **Login Test**: Try logging in with admin/password
4. **API Test**: Check browser network tab for successful API calls

## Common Issues:

### CORS Errors

- Make sure APP_URL on backend matches your Netlify domain
- Check that API calls use the correct backend URL

### Database Issues

- Ensure persistent disk is mounted on Render
- Check that DATABASE_PATH points to the mounted disk

### Build Errors

- Verify all environment variables are set
- Check build logs in Netlify/Render dashboards

### Docker Build Issues (Render)

- Ensure you're using the root directory (not backend folder) when setting up the service
- The Dockerfile is now in the root directory and builds the backend from there
