# Environment Variables Setup for Production Deployment

⚠️ **CRITICAL SECURITY NOTICE** ⚠️
API keys and sensitive credentials have been removed from this repository for security reasons. You must configure these environment variables in your deployment platforms.

## 🌐 Netlify (Frontend) Environment Variables

Go to your Netlify dashboard → Site settings → Environment variables and add:

### Required Variables:

```bash
# Backend API URL
VITE_API_BASE_URL=https://your-backend-domain.onrender.com/api

# Square Configuration (Frontend)
VITE_SQUARE_APPLICATION_ID=sq0idp-your-square-app-id
VITE_SQUARE_LOCATION_ID=your-square-location-id
VITE_SQUARE_ENVIRONMENT=production

# Optional: AI API (if using Gemini features)
GEMINI_API_KEY=your-gemini-api-key
```

### Steps to Configure in Netlify:

1. Log into your Netlify dashboard
2. Go to your site → Site settings → Environment variables
3. Click "Add variable" for each of the above
4. Redeploy your site for changes to take effect

## 🚀 Render (Backend) Environment Variables

Go to your Render dashboard → Your service → Environment and add:

### Required Variables:

```bash
# Application Settings
NODE_ENV=production
PORT=10000
APP_URL=https://your-frontend-domain.netlify.app
JWT_SECRET=your-super-secure-jwt-secret-key

# Database Configuration
DATABASE_PATH=/opt/render/project/src/db

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Square Payment Configuration
SQUARE_APPLICATION_ID=sq0idp-your-square-app-id
SQUARE_APPLICATION_SECRET=sq0csp-your-square-app-secret
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=your-square-location-id
```

### Steps to Configure in Render:

1. Log into your Render dashboard
2. Go to your service → Environment
3. Add each environment variable above
4. Click "Save" - Render will automatically redeploy

## 🔑 Getting Your Square Credentials

1. **Log into Square Developer Dashboard**: https://developer.squareup.com/
2. **Create/Select Application**: Create a new app or select existing
3. **Get Credentials**:
   - **Application ID**: Found in app dashboard (starts with `sq0idp-`)
   - **Application Secret**: Found in app dashboard (starts with `sq0csp-`)
   - **Access Token**: Generate in app dashboard (starts with `EAAAl`)
   - **Location ID**: Found in Locations section

4. **Important Notes**:
   - For production: Use "Production" credentials
   - For testing: Use "Sandbox" credentials
   - Set `SQUARE_ENVIRONMENT=production` for live payments
   - Set `SQUARE_ENVIRONMENT=sandbox` for testing

## 📧 Gmail Configuration

To send emails, you need a Gmail App Password:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use Generated Password** as `EMAIL_PASSWORD` (not your regular Gmail password)

## 🔒 JWT Secret

Generate a secure random string for JWT_SECRET:

```bash
# Use a random string generator or:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🛡️ Security Best Practices

1. **Never commit .env files** to version control
2. **Use different credentials** for development vs production
3. **Rotate API keys regularly**
4. **Monitor usage** in Square dashboard
5. **Set up webhooks** for payment confirmations
6. **Use HTTPS** for all production URLs

## 🧪 Testing Your Setup

After configuring environment variables:

1. **Frontend Test**: Visit your Netlify URL and try the payment form
2. **Backend Test**: Check your Render logs for successful startup
3. **Integration Test**: Complete a test payment flow
4. **Square Dashboard**: Verify payments appear in Square dashboard

## 🚨 Emergency: Leaked Credentials

If credentials are accidentally committed:

1. **Immediately rotate all API keys** in Square dashboard
2. **Update environment variables** in deployment platforms
3. **Force redeploy** both frontend and backend
4. **Check git history** and consider repository cleanup

## 📞 Support

- **Square API**: https://developer.squareup.com/docs
- **Netlify**: https://docs.netlify.com/
- **Render**: https://render.com/docs

---

**Remember**: Never include actual API keys in your code repository. Always use environment variables for sensitive data!
