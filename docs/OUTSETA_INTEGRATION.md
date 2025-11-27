# Outseta Integration Guide for ScentSwap

> **IMPORTANT**: This is the authoritative reference document for Outseta integration.
> All authentication and subscription features MUST follow this guide.

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Outseta      │────▶│    Vercel       │────▶│    Supabase     │
│  (Auth + Billing)│     │  (Next.js API)  │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Outseta** = Single source of truth for users, plans, and billing
- **Supabase** = Data storage only (NO Supabase Auth)
- **Vercel** = Hosts frontend + API routes for webhooks

---

## ScentSwap Outseta Configuration

### Plan UIDs (LIVE)

| Plan | Outseta UID | Price |
|------|-------------|-------|
| **Free** | `z9MP7yQ4` | $0/month |
| **Premium** | `vW5RoJm4` | $9.99/month AUD |
| **Elite** | `aWxr2rQV` | $19.99/month AUD |

### URLs

| Action | URL |
|--------|-----|
| Sign Up | `https://scentswap.outseta.com/auth?widgetMode=register#o-anonymous` |
| Sign Up with Plan | `https://scentswap.outseta.com/auth?widgetMode=register&planUid=<PLAN_UID>#o-anonymous` |
| Log In | `https://scentswap.outseta.com/auth?widgetMode=login#o-anonymous` |
| Profile | `https://scentswap.outseta.com/profile#o-authenticated` |
| JWKS | `https://scentswap.outseta.com/.well-known/jwks` |

---

## ⚠️ CRITICAL: Outseta Admin URL Configuration

### What Goes Where in Outseta Admin

Go to **Auth > Sign Up & Login** in Outseta Admin:

| Setting | Location | Value | Notes |
|---------|----------|-------|-------|
| **Post Login URL** | Login Settings | `https://www.scentswap.com.au/` | Where users go AFTER login. Set to your main app page. |
| **Post Sign Up URL** | Sign Up Settings | **LEAVE EMPTY** | Outseta shows its own confirmation. Don't set this. |
| **Sign Up Callback URL** | Sign Up Settings > Show Advanced Options | `https://www.scentswap.com.au/api/outseta/signup-callback` | Server-to-server webhook for database sync (optional) |

### Why This Works (No Custom Callback Page Needed!)

Outseta's **no-code approach** handles authentication automatically:

1. User clicks "Sign In" → Redirects to Outseta hosted login page
2. User logs in on Outseta
3. Outseta redirects to **Post Login URL** (your app page)
4. **Outseta's embed script automatically detects the user is logged in**
5. `SubscriptionContext` picks up the session via `Outseta.getUser()` and `Outseta.getJwtPayload()`

**You do NOT need:**
- A special `/auth/callback` page to extract tokens from URL
- Any manual token extraction logic
- Complex redirect handling

**The Outseta script handles all of this automatically when `tokenStorage: "local"` is set.**

---

## Step 1: Embed Outseta Script

Add to your app's `<head>` (via `OutsetaScript` component):

```html
<script>
var o_options = {
    domain: 'scentswap.outseta.com',
    load: 'auth,customForm,emailList,leadCapture,nocode,profile,support',
    tokenStorage: 'local',  // Persist across tabs/refreshes
    monitorDom: true        // For SPA navigation
};
</script>
<script src="https://cdn.outseta.com/outseta.min.js"
        data-options="o_options">
</script>
```

### Token Storage Options

- `session` = Tab only (default) - user must login again in new tab
- `local` = Persist across tabs/refreshes (RECOMMENDED)
- `cookie` = Share across subdomains

---

## Step 2: Login/Signup Flow (No-Code Approach)

### Triggering Auth

Simply redirect users to Outseta's hosted pages:

```javascript
// Login - redirect to Outseta hosted page
window.location.href = 'https://scentswap.outseta.com/auth?widgetMode=login#o-anonymous';

// Sign up (no plan pre-selected)
window.location.href = 'https://scentswap.outseta.com/auth?widgetMode=register#o-anonymous';

// Sign up with specific plan pre-selected
window.location.href = 'https://scentswap.outseta.com/auth?widgetMode=register&planUid=vW5RoJm4#o-anonymous';

// Profile/Billing management
window.location.href = 'https://scentswap.outseta.com/profile#o-authenticated';
```

### After Login

Outseta redirects to your **Post Login URL**. The Outseta script:
1. Automatically detects the session
2. Stores the token (if `tokenStorage: "local"`)
3. Makes `Outseta.getUser()` and `Outseta.getJwtPayload()` available

Your `SubscriptionContext` then picks this up and updates the app state.

---

## Step 3: Access User Info Client-Side

```javascript
// Check if Outseta is loaded and user is logged in
if (window.Outseta) {
  // Get full user profile
  const user = await Outseta.getUser();
  console.log(user.Email, user.FirstName, user.LastName);

  // Get JWT payload (quick access to claims)
  const payload = await Outseta.getJwtPayload();
  console.log(payload.email, payload['outseta:planUid']);
}
```

### JWT Payload Contains

- `sub` = Person UID (unique user identifier)
- `email` = User's email
- `outseta:accountUid` = Account UID
- `outseta:planUid` = Current plan ID (e.g., `vW5RoJm4` for Premium)
- `outseta:accountClientIdentifier` = Your internal user ID (if set via webhook)

### Plan Checking

```javascript
const PLAN_UIDS = {
  FREE: 'z9MP7yQ4',
  PREMIUM: 'vW5RoJm4',
  ELITE: 'aWxr2rQV'
};

const payload = await Outseta.getJwtPayload();
if (payload && payload["outseta:planUid"] === PLAN_UIDS.PREMIUM) {
  // Enable premium features
}
```

---

## Step 4: Logout

```javascript
// Clear Outseta session
Outseta.setAccessToken(null);

// Or redirect to handle logout
window.location.href = '/';
```

---

## Step 5: Webhooks (Optional - For Database Sync)

If you need to sync user data to Supabase, set up webhooks:

### Sign-Up Callback Webhook

**Configure in Outseta:** Auth > Sign Up & Login > Show Advanced Options > Sign Up Callback URL

**Set to:** `https://www.scentswap.com.au/api/outseta/signup-callback`

This is a **server-to-server** call (not a browser redirect). Outseta POSTs user data when someone signs up.

### Subscription Update Webhook

**Configure in Outseta:** Settings > Notifications > Add Callback

Events to listen for:
- Subscription Updated
- Subscription Canceled
- Person Updated

**Set to:** `https://www.scentswap.com.au/api/outseta/subscription-updated`

### Webhook Signature Verification

In Outseta: **Settings > Notifications > Webhook Signature Key** (32-byte hex string)

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}
```

---

## Step 6: Environment Variables (Vercel)

```env
# Supabase
SUPABASE_URL=https://vdcgbaxjfllprhknwwyd.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only

# Outseta
OUTSETA_WEBHOOK_SECRET=your-32-byte-hex-key  # From Outseta Settings > Notifications

# Public (exposed to client)
EXPO_PUBLIC_SUPABASE_URL=https://vdcgbaxjfllprhknwwyd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## ScentSwap Subscription Plans (LIVE)

### Free Plan
- **Outseta Plan UID**: `z9MP7yQ4`
- **Price**: $0/month
- **Max Listings**: 5
- **Features**: Basic swapping

### Premium Plan
- **Outseta Plan UID**: `vW5RoJm4`
- **Price**: $9.99/month AUD
- **Max Listings**: 25
- **Features**:
  - priority_matching
  - photo_verification
  - no_ads
  - premium_badge

### Elite Plan
- **Outseta Plan UID**: `aWxr2rQV`
- **Price**: $19.99/month AUD
- **Max Listings**: Unlimited
- **Features**:
  - All Premium features
  - advanced_analytics
  - instant_messaging
  - bulk_upload
  - export_data
  - early_access

---

## Database Schema Requirements

Ensure your Supabase `users` table has:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS outseta_person_uid TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS outseta_account_uid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
```

---

## Admin Authentication

ScentSwap uses a **hardcoded email whitelist** for admin access.

### Admin Whitelist Location

`lib/admin.ts`:

```typescript
const ADMIN_EMAILS = ['downscale@icloud.com'];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
```

### Adding New Admins

1. Edit `lib/admin.ts`
2. Add email to `ADMIN_EMAILS` array
3. Commit and deploy

### Creating Founder Account with 100% Discount

1. **Create Coupon in Outseta**:
   - Go to **BILLING > COUPONS**
   - Click **+ Add Coupon**
   - Code: `FOUNDER100`
   - Discount: `100%`
   - Duration: Forever
   - Max Redemptions: `1`

2. **Sign Up with Coupon**:
   - Go to app sign-up page
   - Select **Elite** plan
   - Enter coupon code `FOUNDER100` at checkout
   - Use email that's in `ADMIN_EMAILS` whitelist

---

## Key Principles

1. **DO NOT use Supabase Auth** - Outseta is the only auth provider
2. **Use Outseta's no-code approach** - Let the script handle token storage
3. **Post Login URL** = Your main app page (e.g., `/` or `/browse`)
4. **Post Sign Up URL** = LEAVE EMPTY (Outseta handles confirmation)
5. **Sign Up Callback URL** = Webhook endpoint for database sync (optional)
6. **Store Outseta IDs in Supabase** for linking data to users
7. **Keep secrets in Vercel env vars** only, never expose to client

---

## Troubleshooting

### User redirected to wrong page after login
- Check **Post Login URL** in Outseta Admin (Auth > Sign Up & Login)
- Should be your app page, NOT an API endpoint

### User session not persisting
- Ensure `tokenStorage: "local"` is set in `o_options`
- Check that Outseta script is loading on all pages

### Webhook not receiving data
- Verify webhook URL is publicly accessible
- Check Vercel function logs for errors
- Ensure webhook signature key is set in both Outseta and Vercel env vars

---

## Sources

1. [Outseta Knowledge Base – Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
2. [Outseta – Configure Sign Up & Login Settings](https://go.outseta.com/support/kb/articles/aOW4DGWg/configure-your-sign-up-and-login-settings)
3. [Outseta – Integrate with Backend Database](https://go.outseta.com/support/kb/articles/B9lV2dm8/integrate-outseta-with-your-backend-database)
4. [Integrate Supabase with Outseta Auth for RLS](https://go.outseta.com/support/kb/articles/MQv4aaWY/integrate-supabase-with-outseta-auth-for-row-level-security-rls)
