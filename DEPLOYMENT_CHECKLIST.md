# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Security

- [x] **Remove API keys from repository**
  - [x] Cleaned `.env.local` (frontend)
  - [x] Cleaned `backend/.env` (backend)
  - [x] Updated `.gitignore` to exclude .env files
  - [x] Created `.env.example` template files

- [x] **Added environment variable validation**
  - [x] Frontend: Square config validation
  - [x] Backend: Environment variable checks

## 🌐 Netlify (Frontend) Deployment

### Required Environment Variables:

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_SQUARE_APPLICATION_ID=sq0idp-your-app-id
VITE_SQUARE_LOCATION_ID=your-location-id
VITE_SQUARE_ENVIRONMENT=production
```

### Steps:

1. [ ] Deploy to Netlify
2. [ ] Configure environment variables in Netlify dashboard
3. [ ] Update build settings if needed
4. [ ] Test deployment

## 🚀 Render (Backend) Deployment

### Required Environment Variables:

```bash
NODE_ENV=production
PORT=10000
APP_URL=https://your-frontend.netlify.app
JWT_SECRET=your-secure-jwt-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
SQUARE_APPLICATION_ID=sq0idp-your-app-id
SQUARE_APPLICATION_SECRET=sq0csp-your-app-secret
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=your-location-id
DATABASE_PATH=/opt/render/project/src/db
```

### Steps:

1. [ ] Deploy to Render
2. [ ] Configure environment variables in Render dashboard
3. [ ] Verify database persistence
4. [ ] Test backend endpoints

## 🧪 Post-Deployment Testing

### Frontend Tests:

- [ ] Site loads correctly
- [ ] Square payment form displays
- [ ] Environment variables loaded correctly
- [ ] No console errors related to missing config

### Backend Tests:

- [ ] Server starts without environment variable warnings
- [ ] Database initializes correctly
- [ ] Square API connection works
- [ ] Payment endpoints respond correctly

### Integration Tests:

- [ ] Frontend can communicate with backend
- [ ] Order creation works
- [ ] Payment processing flow works (with test card)
- [ ] Error handling works properly

## 🔒 Security Verification

- [ ] No API keys visible in browser developer tools
- [ ] No sensitive data in git repository
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly
- [ ] Environment variables properly secured

## 📝 Documentation Updates

- [x] Created `ENVIRONMENT_SETUP.md`
- [x] Updated deployment documentation
- [ ] Update README with deployment URLs
- [ ] Document any production-specific configurations

## 🚨 Rollback Plan

If deployment fails:

1. [ ] Revert to previous working deployment
2. [ ] Check environment variable configuration
3. [ ] Verify API key validity in Square dashboard
4. [ ] Check application logs for specific errors

---

**Next Steps After Deployment:**

1. Test with real payment data
2. Set up Square webhooks for payment confirmations
3. Configure monitoring and alerting
4. Set up automated backups
5. Plan for SSL certificate renewal
