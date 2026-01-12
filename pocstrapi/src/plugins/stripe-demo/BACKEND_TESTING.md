# Stripe Demo Plugin - Backend Testing Guide

## Overview

This document provides testing instructions for the Stripe Demo plugin backend functionality.

## Implementation Summary

### Files Created/Modified

1. **Policy**: `server/src/policies/is-super-admin.ts`
   - Checks if user is super admin
   - Returns `false` if no user or not super admin
   - Returns `true` if user is super admin

2. **Service**: `server/src/services/service.ts`
   - `getStripeKey()`: Retrieves Stripe key from plugin store
   - `saveStripeKey(stripeKey)`: Saves Stripe key to plugin store

3. **Controller**: `server/src/controllers/controller.ts`
   - `getConfig(ctx)`: GET endpoint to retrieve configuration
   - `saveConfig(ctx)`: PUT endpoint to save configuration

4. **Routes**: `server/src/routes/admin/index.ts`
   - `GET /strapi-plugin/stripe-demo/config`: Get configuration
   - `PUT /strapi-plugin/stripe-demo/config`: Save configuration
   - Both routes protected by `is-super-admin` policy

## Testing Instructions

### Step 1: Setup Development Environment

1. **Switch to Node 20:**
   ```bash
   nvm use 20
   ```

2. **Start Plugin Watch Mode** (Terminal 1):
   ```bash
   cd src/plugins/stripe-demo
   npm run watch:link
   ```
   This will watch for changes and rebuild the plugin.

3. **Start Strapi Development Server** (Terminal 2):
   ```bash
   cd /path/to/pocstrapi  # Go back to project root
   npm run develop
   ```

### Step 2: Access Strapi Admin Panel

1. Open browser and navigate to: `http://localhost:1337/admin`
2. Login with your super admin credentials

### Step 3: Get Authentication Token

You'll need the JWT token from your browser session. You can get it from:
- Browser DevTools → Application → Cookies → `strapi-jwt-token`
- Or use browser DevTools → Network tab → Look for requests to `/admin` endpoints

### Step 4: Test Endpoints Using curl or Postman

#### Test 1: Get Configuration (Should return null initially)

```bash
curl -X GET http://localhost:1337/stripe-demo/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "stripeKey": null
}
```

**Status Code:** 200

#### Test 2: Save Configuration (Super Admin Only)

```bash
curl -X PUT http://localhost:1337/stripe-demo/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stripeKey": "sk_test_example123456789"}'
```

**Expected Response:**
```json
{
  "message": "Stripe key saved successfully"
}
```

**Status Code:** 200

#### Test 3: Get Configuration (Should return saved key)

```bash
curl -X GET http://localhost:1337/stripe-demo/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "stripeKey": "sk_test_example123456789"
}
```

**Status Code:** 200

#### Test 4: Test Policy Protection (Non-Super Admin - Should Fail)

If you have a non-super admin user:
```bash
curl -X GET http://localhost:1337/strapi-plugin/stripe-demo/config \
  -H "Authorization: Bearer NON_SUPER_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
- Status Code: 403 (Forbidden)
- Or error message indicating access denied

#### Test 5: Test Validation (Invalid Input)

```bash
curl -X PUT http://localhost:1337/strapi-plugin/stripe-demo/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stripeKey": ""}'
```

**Expected Response:**
```json
{
  "error": {
    "status": 400,
    "message": "Stripe key is required and must be a string"
  }
}
```

**Status Code:** 400

### Step 5: Verify Data Persistence

1. Restart Strapi server
2. Get configuration again - the key should still be there
3. This confirms the plugin store is working correctly

## Testing Checklist

- [ ] TypeScript compilation succeeds (no errors)
- [ ] Plugin builds successfully
- [ ] Strapi starts without errors
- [ ] GET /config returns 200 with `{ stripeKey: null }` initially
- [ ] PUT /config saves the key successfully (200 status)
- [ ] GET /config returns the saved key (200 status)
- [ ] Policy blocks non-super admin users (403 status)
- [ ] Validation rejects empty/invalid inputs (400 status)
- [ ] Data persists after server restart

## Troubleshooting

### Plugin Not Loading
- Check that plugin is enabled in `config/plugins.ts`
- Verify plugin path is correct
- Check console for build errors

### Routes Not Found (404)
- Verify routes are registered correctly
- Check route path matches: `/stripe-demo/config` (NOT `/strapi-plugin/stripe-demo/config`)
- Ensure plugin is built: `npm run build` in plugin directory

### Policy Not Working (403 for Super Admin)
- Verify user is actually a super admin
- Check `user.isSuperAdmin === true` in policy
- Check browser console for authentication errors

### Data Not Persisting
- Verify plugin store is being used correctly
- Check database for `core_store` table
- Verify store key: `plugin_stripe-demo_config`

## Next Steps

Once backend testing is complete:
1. Create admin panel UI for configuration
2. Add form validation
3. Add loading states
4. Add success/error notifications

