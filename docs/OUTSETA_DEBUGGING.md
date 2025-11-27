# Outseta Debugging Guide

This guide addresses common issues with Outseta integration, specifically regarding email templates and authentication flows.

## 🚨 "Login to your new account" Email Issue

**Symptom:**
When a user signs up, they receive an email saying "Your account has been created" with a "Login" button, instead of "Confirm your account" with a "Set Password" link.

**Cause:**
Outseta thinks you want to skip the confirmation step. This happens if the **Post Sign Up URL** is set in the Outseta Dashboard.

**Solution:**
1. Go to **Outseta Admin > Auth > Sign Up & Login**.
2. Find the **Sign up settings** section.
3. Look for **"Post sign up URL"**.
4. **DELETE** any value in this field. It must be completely **EMPTY**.
5. Ensure **"Send sign up confirmation email"** is turned **ON**.
6. Click **Save**.

**Why this works:**
When "Post sign up URL" is empty, Outseta defaults to the "Confirm email" flow. If you put a URL there (e.g., your homepage), Outseta assumes you are handling the post-signup experience and just sends a generic welcome email.

---

## ⚠️ "Minified React error #418" (Hydration Error)

**Symptom:**
Console shows `Uncaught Error: Minified React error #418` referring to hydration mismatch.

**Cause:**
Rendering different HTML on the server vs the client. Common culprit: using conditional `<a>` tags or browser-only APIs inside the initial render logic.

**Solution (ALREADY APPLIED):**
We switched from injecting HTML `<a>` tags to using standard React Native `TouchableOpacity` components combined with the Outseta JavaScript API (`Outseta.auth.open()`).

**Verification:**
If you still see this error, ensure you are viewing the latest deployment. Clear your browser cache or try an Incognito window.

---

## 🔍 Verifying Outseta Configuration

### 1. Correct Script Options (in code)
Ensure `components/OutsetaScript.tsx` has:
```javascript
window.o_options = {
  domain: 'scentswap.outseta.com',
  monitorDom: "true", // Must be string "true"
  load: "nocode,auth,profile",
  tokenStorage: "local" // CRITICAL for keeping user logged in
};
```

### 2. Correct Auth Trigger (in code)
Ensure `register.tsx` calls:
```javascript
Outseta.auth.open({
  widgetMode: 'register', // Triggers signup flow
  mode: 'popup',          // Keeps user on page
  planUid: '...',
  skipPlanOptions: true
});
```

### 3. Correct Dashboard Settings (in Outseta)
- **Post Login URL**: `https://www.scentswap.com.au/` (or wherever you want users to land)
- **Post Sign Up URL**: **EMPTY** (Crucial for password setup email)
- **Sign Up Callback URL**: `https://www.scentswap.com.au/api/outseta/signup-callback` (For Supabase sync)

