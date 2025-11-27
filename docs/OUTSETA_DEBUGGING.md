# Outseta Debugging Guide

## 1. Hydration Errors (React Error #418)

**Status:** ✅ Fixed
**Cause:** `Math.random()` in `SprayParticle` component caused server/client mismatch.
**Fix:** Replaced with deterministic values based on particle index.

## 2. Wrong Email Template ("Login" instead of "Confirm")

**Status:** ❓ Needs Verification
**Code Logic:**
We are explicitly calling:
```javascript
Outseta.auth.open({
  widgetMode: 'register', // Triggers registration flow
  mode: 'popup',          // Keeps user on page
  planUid: '...'
});
```

**Troubleshooting:**
If you still receive the "Login to your new account" email instead of "Confirm your account", check these Outseta settings:

1.  **Post Sign Up URL** (Critical):
    *   Go to **Auth > Sign up and Login**
    *   Find **"Post sign up URL"**
    *   **MUST BE EMPTY** to trigger confirmation email.
    *   If set to *any* URL, Outseta assumes you want an immediate redirect and skips the confirmation email.

2.  **Send Sign Up Confirmation Email**:
    *   Go to **Auth > Sign up and Login**
    *   Ensure toggle is **ON**.

## 3. Pop-up Not Opening

**Status:** ✅ Fixed
**Cause:** Conditional `<a>` vs `TouchableOpacity` rendering caused hydration issues.
**Fix:** Standardized on `TouchableOpacity` + JavaScript API.

## Verification Steps

1.  Wait for Vercel deployment.
2.  Hard refresh (Cmd+Shift+R) to clear cache.
3.  Open Console -> Verify no "Minified React error #418".
4.  Click "Get Premium".
5.  Complete signup.
6.  Check email content.
