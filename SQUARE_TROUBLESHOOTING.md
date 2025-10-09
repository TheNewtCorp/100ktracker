# 🔧 Square Payment Form Troubleshooting Guide

## Issue: Square Card Form Blank in Production

If the Square payment form appears blank in production but works locally, follow these debugging steps:

### Step 1: Check Environment Variables in Netlify

1. Go to **Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**
2. Verify these variables are set:
   ```
   VITE_SQUARE_APPLICATION_ID=sq0idp-your-actual-app-id
   VITE_SQUARE_LOCATION_ID=your-actual-location-id
   VITE_SQUARE_ENVIRONMENT=production
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```

### Step 2: Verify Square Credentials

1. **Check Square Developer Dashboard**: https://developer.squareup.com/
2. **Verify Application ID** matches exactly (starts with `sq0idp-`)
3. **Verify Location ID** matches exactly
4. **Ensure Production Environment** is selected (not Sandbox)

### Step 3: Debug Environment Variables

Temporarily add this to your component to check env vars:

```tsx
import SquareDebugInfo from '../debug/SquareDebugInfo';

// Add this above your payment form
<SquareDebugInfo />;
```

### Step 4: Check Browser Console

1. Open **Developer Tools** → **Console**
2. Look for Square-related errors or logs:
   - `❌ VITE_SQUARE_APPLICATION_ID environment variable is required`
   - `❌ Square SDK failed to load`
   - `❌ Square configuration validation failed`

### Step 5: Network Tab Check

1. Open **Developer Tools** → **Network**
2. Reload the page
3. Look for failed requests to Square CDN:
   - `https://web.squarecdn.com/v1/square.js` (Production)
   - `https://sandbox.web.squarecdn.com/v1/square.js` (Sandbox)

### Common Issues & Solutions

#### 1. Environment Variables Not Set

**Symptoms:** Console shows "MISSING_SQUARE_APP_ID" errors
**Solution:**

- Verify env vars are set in Netlify
- Redeploy after setting variables
- Check variable names exactly match (case-sensitive)

#### 2. Sandbox vs Production Mismatch

**Symptoms:** "Invalid application ID" or authentication errors
**Solution:**

- Ensure `VITE_SQUARE_ENVIRONMENT=production`
- Use production credentials, not sandbox
- Match environment with credential type

#### 3. Square SDK Not Loading

**Symptoms:** "Square SDK failed to load" errors
**Solution:**

- Check internet connectivity
- Verify no ad blockers blocking Square CDN
- Check CSP headers not blocking external scripts

#### 4. Incorrect Location ID

**Symptoms:** "Invalid location ID" errors
**Solution:**

- Get Location ID from Square Dashboard → Locations
- Use the exact ID (case-sensitive)
- Ensure location is active

#### 5. CORS Issues

**Symptoms:** Network errors in console
**Solution:**

- Verify Square app is configured for your domain
- Check Square app settings for allowed domains

### Step 6: Manual Verification

Test Square configuration directly in console:

```javascript
// Check environment variables
console.log('Environment check:', {
  MODE: import.meta.env.MODE,
  API_URL: import.meta.env.VITE_API_BASE_URL,
  SQUARE_APP_ID: import.meta.env.VITE_SQUARE_APPLICATION_ID?.substring(0, 10) + '...',
  SQUARE_LOC_ID: import.meta.env.VITE_SQUARE_LOCATION_ID?.substring(0, 10) + '...',
  SQUARE_ENV: import.meta.env.VITE_SQUARE_ENVIRONMENT,
});

// Test Square SDK loading
if (window.Square) {
  console.log('✅ Square SDK loaded');
  try {
    const payments = window.Square.payments(
      import.meta.env.VITE_SQUARE_APPLICATION_ID,
      import.meta.env.VITE_SQUARE_LOCATION_ID,
    );
    console.log('✅ Square payments initialized');
  } catch (e) {
    console.error('❌ Square payments failed:', e);
  }
} else {
  console.error('❌ Square SDK not loaded');
}
```

### Step 7: Backend Check

Verify backend is working:

```bash
curl https://your-backend.onrender.com/api/payments/create-checkout-session \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "selectedPlan": "monthly"
  }'
```

### Step 8: Rollback Plan

If issues persist:

1. **Check last working version** in git history
2. **Revert to known working state**
3. **Apply changes incrementally**
4. **Test each change in production**

### Quick Checklist

- [ ] Environment variables set in Netlify
- [ ] Variables exactly match Square dashboard
- [ ] Redeployed after setting env vars
- [ ] Browser console shows no errors
- [ ] Square SDK loading successfully
- [ ] Backend API responding correctly
- [ ] No ad blockers interfering
- [ ] Correct production vs sandbox environment

---

**Need Help?** Check the browser console first - it will show exactly what's failing! 🔍
