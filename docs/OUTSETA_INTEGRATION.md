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
- **Vercel** = Hosts frontend + API routes for JWT exchange and webhooks

---

## Step 1: Embed Outseta's Sign-Up, Login, and Subscription Components

### Include Outseta Script

Add to `<head>` in `_document.js` or via Next's Head component:

```html
<script>
  var o_options = { domain: "[your-subdomain].outseta.com" };
</script>
<script src="https://cdn.outseta.com/outseta.min.js" data-options="o_options"></script>
```

### Configure in Outseta Admin

1. **Auth > Sign Up & Login**:
   - Set up subscription Plans (under Billing > Plans)
   - Enable "Send sign up confirmation email"
   - Set Post Login URL (e.g., `/dashboard`)

2. **Auth > Embeds**:
   - Copy Sign-Up form embed code
   - Copy Login form embed code
   - Copy Profile embed code (for account management)

### Trigger Auth Modals

```javascript
// Sign up
Outseta.openSignUp();

// Login
Outseta.openLogin();

// Profile/Billing management
Outseta.openProfile();
```

---

## Step 2: Implement Login Flow and Session Handling

### Post-Login Redirect

After login, Outseta redirects to Post Login URL with JWT:

```
https://yourapp.com/dashboard?access_token=<JWT_TOKEN>
```

### Token Storage Options

Configure in `o_options`:

```javascript
var o_options = {
  domain: "[your-subdomain].outseta.com",
  tokenStorage: "local"  // Options: "session" (default), "local", "cookie"
};
```

- `session` = Tab only (default)
- `local` = Persist across tabs/refreshes
- `cookie` = Share across subdomains

### Access User Info Client-Side

```javascript
// Get full user profile
const user = await Outseta.getUser();

// Get JWT payload (quick access to claims)
const payload = await Outseta.getJwtPayload();

// Check plan
if (payload && payload["outseta:planUid"] === "<PREMIUM_PLAN_UID>") {
  // Enable premium features
}
```

### JWT Payload Contains

- `sub` = Person UID (unique user identifier)
- `email` = User's email
- `outseta:accountUid` = Account UID
- `outseta:planUid` = Current plan ID
- `outseta:accountClientIdentifier` = Your internal user ID (if set)

---

## Step 3: Secure Server-Side Communication

### Verify Outseta JWT on Backend

**ALWAYS verify the token before trusting any user info.**

Using `jose` library:

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL("https://<your-subdomain>.outseta.com/.well-known/jwks")
);

async function verifyOutsetaToken(accessToken) {
  const { payload } = await jwtVerify(accessToken, JWKS);
  return payload; // Contains sub, email, outseta:accountUid, etc.
}
```

### Exchange Outseta JWT for Supabase JWT (for RLS)

Create API route `/api/auth/exchange-token`:

```javascript
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

export async function POST(req) {
  const { outsetaToken } = await req.json();
  
  // 1. Verify Outseta token
  const JWKS = createRemoteJWKSet(
    new URL("https://<subdomain>.outseta.com/.well-known/jwks")
  );
  const { payload } = await jwtVerify(outsetaToken, JWKS);
  
  // 2. Create Supabase-signed JWT
  const supabaseJwt = await new SignJWT({
    sub: payload.sub,                          // Outseta Person UID
    email: payload.email,
    role: "authenticated",                     // REQUIRED by Supabase
    "outseta:accountUid": payload["outseta:accountUid"],
    "outseta:planUid": payload["outseta:planUid"],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET));
  
  return Response.json({ supabaseToken: supabaseJwt });
}
```

### Use Supabase JWT on Frontend

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${supabaseJwt}`
    }
  }
});
```

### RLS Policy Example

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON listings
  FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_outseta_uid);
```

---

## Step 4: Sync Outseta Users & Subscriptions to Supabase

### Sign-Up Callback Webhook

Configure in Outseta: **Auth > Sign Up & Login > Show Advanced Options > Sign Up Callback URL**

Set to: `https://yourapp.com/api/outseta/signup-callback`

```javascript
// /api/outseta/signup-callback
export async function POST(req) {
  // 1. Verify webhook signature (see below)
  
  // 2. Parse payload
  const data = await req.json();
  const { Person, Account, Subscription } = data;
  
  // 3. Create user in Supabase
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      outseta_person_uid: Person.Uid,
      outseta_account_uid: Account.Uid,
      email: Person.Email,
      full_name: `${Person.FirstName} ${Person.LastName}`,
      subscription_plan: Subscription?.Plan?.Name || 'free',
      subscription_status: Subscription?.Status || 'active',
    })
    .select()
    .single();
  
  // 4. Return ClientIdentifier (your internal ID)
  return Response.json({
    ...data,
    ClientIdentifier: user.id  // This gets stored in Outseta
  });
}
```

### Verify Webhook Signature

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

// In your webhook handler:
const signature = req.headers.get('x-hub-signature-256');
const rawBody = await req.text();
if (!verifyWebhookSignature(rawBody, signature, process.env.OUTSETA_WEBHOOK_SECRET)) {
  return Response.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### Subscription Update Webhook

Configure in Outseta: **Settings > Notifications > Add Callback**

Events to listen for:
- Subscription Updated
- Subscription Canceled
- Person Updated

```javascript
// /api/outseta/subscription-updated
export async function POST(req) {
  // Verify signature...
  
  const { Account, Subscription } = await req.json();
  
  await supabase
    .from('users')
    .update({
      subscription_plan: Subscription?.Plan?.Name || 'free',
      subscription_status: Subscription?.Status,
      updated_at: new Date().toISOString(),
    })
    .eq('outseta_account_uid', Account.Uid);
  
  return Response.json({ success: true });
}
```

---

## Step 5: Frontend Protected Content

### Outseta Protected Content Rules

Configure in Outseta: **Auth > Protected Content**

1. Define URL pattern (e.g., `/dashboard`, `/premium/*`)
2. Assign which Plans have access
3. Set Access Denied URL (redirect for unauthorized users)

### Show/Hide Elements by Plan

```html
<!-- Show only to logged-in members -->
<div data-outseta-show="members">
  Welcome back!
</div>

<!-- Show only to Premium plan -->
<div data-outseta-show="premium">
  Premium feature here
</div>

<!-- Hide from Premium (show upgrade prompt) -->
<div data-outseta-hide="premium">
  Upgrade to Premium to unlock this feature
</div>
```

### Logout

```javascript
Outseta.logout();
```

---

## Step 6: Environment Variables (Vercel)

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only
SUPABASE_JWT_SECRET=your-jwt-secret  # For signing exchanged tokens

# Outseta
OUTSETA_SUBDOMAIN=your-subdomain
OUTSETA_WEBHOOK_SECRET=your-32-byte-hex-key

# Public (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_OUTSETA_DOMAIN=your-subdomain.outseta.com
```

---

## ScentSwap Subscription Plans

### Free Plan
- **Plan ID**: `free`
- **Price**: $0/month
- **Max Listings**: 5
- **Features**: Basic swapping

### Premium Plan
- **Plan ID**: `premium`
- **Price**: $9.99/month AUD
- **Max Listings**: 25
- **Features**:
  - unlimited_listings (up to 25)
  - priority_matching
  - photo_verification
  - no_ads
  - premium_badge

### Elite Plan
- **Plan ID**: `elite`
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

## Key Principles

1. **DO NOT use Supabase Auth** - Outseta is the only auth provider
2. **ALWAYS verify Outseta JWT** on server before trusting user info
3. **Store Outseta IDs in Supabase** for linking data to users
4. **Use webhooks** to sync subscription changes, don't poll
5. **Keep secrets in Vercel env vars** only, never expose to client

---

## Sources

1. [Outseta Knowledge Base – Integrations](https://go.outseta.com/support/kb/categories/qNmd5Q0x/integrations)
2. [Outseta – SaaS & Membership Billing](https://www.outseta.com/payments)
3. [Outseta – Authentication & Protected Content](https://www.outseta.com/authentication)
4. [Integrate Supabase with Outseta Auth for RLS](https://go.outseta.com/support/kb/articles/MQv4aaWY/integrate-supabase-with-outseta-auth-for-row-level-security-rls)
5. [Decode and verify Outseta JWT Access Tokens](https://go.outseta.com/support/kb/articles/wQX70amK/decode-and-verify-outseta-jwt-access-tokens-server-side)
6. [Feedback Fort: Outseta with React & Supabase](https://go.outseta.com/support/kb/articles/VmAOa49a/feedback-fort-outseta-with-react-supabase)

