# ScentSwap

<p align="center">
  <img src="assets/images/logo.png" alt="ScentSwap Logo" width="200"/>
</p>

<p align="center">
  <strong>Australia's First AI-Powered Fragrance Bartering Marketplace</strong>
</p>

<p align="center">
  <em>Trade scents, not cash</em>
</p>

---

## What is ScentSwap?

ScentSwap is a peer-to-peer marketplace app for **cashless fragrance trading** in Australia. No buying, no selling — just swapping.

The fragrance community has millions of dollars worth of "dead stock" sitting on shelves — blind buys that didn't work out, impulse purchases gathering dust. ScentSwap unlocks that value through pure trade.

**Core Principles:**
- **No Money, No Drama** — Swapping eliminates price haggling and payment scams
- **AI as the Neutral Party** — Fairness engine ensures balanced trades
- **Trust is Everything** — Verification tiers, ratings, and swap history build community trust
- **Australian First** — Accountable users, reasonable shipping, local community

---

## 🎯 Fragrance Master Database: The Core Asset

**ScentSwap's competitive advantage lies in its comprehensive fragrance master database.**

### Database Assets
- **24,063 Real Fragrances** from authentic sources
- **Multi-Source Enhancement** via Fragrantica, brand websites, and user uploads
- **Intelligent Duplicate Prevention** using URL-based unique identification
- **Rich Metadata** including notes, ratings, perfumers, families, performance metrics
- **Smart Enhancement System** that enriches existing records without overwriting

### Data Sources & Scrapers
| Source | Status | Count | Quality |
|--------|--------|-------|---------|
| **Fragrantica** | ✅ Imported | 24,063 | Verified community data |
| **Brand Websites** | ✅ Scrapers Built | Live | Official product info |
| **User Uploads** | 🚧 CSV/JSON Import | Unlimited | Community enhanced |
| **URL Processing** | 🚧 In Development | Dynamic | Real-time updates |

### Key Features
- **🔍 Advanced Search** across 24K+ fragrances with full-text indexing
- **🤖 AI Enhancement** automatically enriches fragrance data
- **📊 Performance Tracking** monitors longevity, sillage, and user ratings
- **🛡️ Zero Duplicates** intelligent upsert system prevents database corruption
- **💎 Monetization Ready** structured for licensing and API access

### Database Technology
- **PostgreSQL** with JSONB fields for flexible metadata
- **Full-Text Search** with tsvector indexing
- **Real-Time Updates** via Supabase triggers
- **Australian Compliance** ready for TGA/AHPRA regulations

**This fragrance database represents thousands of hours of data curation and is the foundation for all AI-powered features including fairness scoring, swap matching, and market valuation.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo SDK 54) |
| **Navigation** | Expo Router (file-based) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **AI Services** | Claude API (mediation, matching, fairness) |
| **State** | React Context |
| **Styling** | React Native StyleSheet |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/Justy6674/scentswap.git
cd scentswap
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment

Create `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run

```bash
# Web (development)
npm run web

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

---

## Project Structure

```
scentswap/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login, Register
│   ├── (tabs)/            # Main navigation
│   │   ├── index.tsx      # Home / Discover
│   │   ├── cabinet.tsx    # My Cabinet
│   │   ├── swaps.tsx      # Active Swaps
│   │   └── profile.tsx    # User Profile
│   ├── listing/           # Listing detail & create
│   ├── swap/              # Swap detail & create
│   ├── profile/           # Other user profiles
│   └── search.tsx         # Search & filters
├── components/            # Reusable UI components
│   └── search/            # Search-specific components
├── contexts/              # React Context providers
├── lib/                   # Database & API clients
│   ├── supabase.ts       # Supabase client
│   ├── database.ts       # DB operations
│   └── ai.ts             # Claude AI integration
├── supabase/             # Database schema & migrations
├── types/                # TypeScript definitions
└── constants/            # Theme colors & config
```

---

## Database Schema

Core tables in Supabase:

| Table | Purpose |
|-------|---------|
| `fragrance_master` | **🎯 CORE ASSET** - 24K+ fragrances with smart enhancement system |
| `users` | Accounts, verification tiers, ratings |
| `listings` | Fragrance listings with photos, fill levels, search facets |
| `swaps` | Trade proposals, status tracking, fairness scores |
| `messages` | Chat between swappers, AI mediation flags |
| `ratings` | Post-swap reviews (accuracy, packaging, communication) |
| `wishlists` | User fragrance wants |

### Fragrance Master Table Schema

```sql
fragrance_master (
    id UUID PRIMARY KEY,
    fragrantica_url TEXT UNIQUE,          -- Unique identifier (prevents duplicates)
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    concentration TEXT,                   -- Eau de Parfum, EDT, etc.
    family TEXT,                         -- Woody, Floral, Oriental
    country TEXT,
    gender TEXT,
    year_released INTEGER,
    rating_value NUMERIC,
    rating_count INTEGER,
    longevity_rating NUMERIC,
    sillage_rating NUMERIC,
    performance_level TEXT,
    top_notes TEXT[],
    middle_notes TEXT[],
    base_notes TEXT[],
    all_notes TEXT[],                    -- Computed field
    main_accords TEXT[],
    perfumers TEXT[],
    image_url TEXT,
    average_price_aud NUMERIC,
    market_tier TEXT,                    -- luxury, niche, designer, standard
    description TEXT,
    tags TEXT[],
    search_vector TSVECTOR,              -- Full-text search
    source_type TEXT,                    -- csv_import, brand_scraper, user_upload
    data_quality_score INTEGER DEFAULT 50,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

See `supabase/schema.sql` for complete schema with RLS policies.

---

## Key Features

### ✅ Implemented (MVP)
- User registration + verification tiers
- Cabinet management (add/edit listings)
- Marketplace browse with filters
- Swap proposals with fairness scoring
- In-app chat
- Rating system
- Shipping tracking

### 🚧 In Progress
- AI fairness engine refinement
- Photo authenticity checks
- Advanced search filters

### 📋 Planned
- AI swap suggestions & wishlist matching
- Decant-specific listings
- Batch desirability scoring
- Premium features

See [PRD.md](./PRD.md) for complete product requirements and UX specifications.

---

## User Verification Tiers

| Tier | Requirements | Badge | Privileges |
|------|-------------|-------|------------|
| Unverified | Email only | None | Can browse, cannot swap |
| Verified | ID + Address confirmed | ✓ | Swap up to $200 value |
| Trusted | 5+ swaps, 4.5+ rating | ⭐ | Unlimited swap value |
| Elite | 20+ swaps, 4.8+ rating, 6+ months | 💎 | Priority matching, featured listings |

---

## Admin Authentication

ScentSwap uses a **hardcoded email whitelist** for admin access (similar to TeleCheck's approach). This is simple, secure, and works across both Supabase and Outseta authentication methods.

### How It Works

```
User logs in (via Outseta or Supabase)
         ↓
App checks email against ADMIN_EMAILS whitelist
         ↓
isAdmin('downscale@icloud.com') → true
         ↓
Admin tab visible in navigation
Admin dashboard accessible
```

### Admin Whitelist

Located in `lib/admin.ts`:

```typescript
const ADMIN_EMAILS = ['downscale@icloud.com'];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
```

### Adding New Admins

1. Edit `lib/admin.ts`
2. Add email to the `ADMIN_EMAILS` array
3. Deploy the change

```typescript
const ADMIN_EMAILS = [
  'downscale@icloud.com',
  'new-admin@example.com',  // Add new admin here
];
```

### Admin Features

- **Platform Statistics**: Users, listings, swaps, subscription tiers
- **User Management**: Verify users, suspend accounts
- **Dispute Resolution**: Review and resolve swap disputes
- **Listing Moderation**: (Coming soon)

---

## Outseta Integration

ScentSwap uses [Outseta](https://outseta.com) for authentication and subscription management.

### Configuration

| Setting | Value |
|---------|-------|
| Domain | `scentswap.outseta.com` |
| Free Plan UID | `z9MP7yQ4` |
| Premium Plan UID | `vW5RoJm4` |
| Elite Plan UID | `aWxr2rQV` |

### Auth URLs

- **Login**: `https://scentswap.outseta.com/auth?widgetMode=login#o-anonymous`
- **Sign Up**: `https://scentswap.outseta.com/auth?widgetMode=register#o-anonymous`
- **Profile**: `https://scentswap.outseta.com/profile#o-authenticated`

### Creating a Founder/Admin Account with 100% Discount

1. Go to **Outseta Admin > BILLING > COUPONS**
2. Create new coupon:
   - **Code**: `FOUNDER100`
   - **Discount**: 100%
   - **Duration**: Forever
   - **Max Redemptions**: 1
3. Sign up for Elite plan using the coupon code
4. Your email must be in the `ADMIN_EMAILS` whitelist in `lib/admin.ts`

See `.cursor/rules/outseta.mdc` for full Outseta integration documentation.

---

## Color Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Teal | `#6AABA3` | Buttons, headers, active states |
| Accent Coral | `#E8A898` | Highlights, notifications, CTAs |
| Success | `#22C55E` | Confirmations, completed swaps |
| Warning | `#F59E0B` | Alerts, pending states |
| Error | `#EF4444` | Errors, declined swaps |

**Dark Theme:** Background `#0A0A0B`, Card `#18181B`, Text `#F9FAFB`

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Links

- **GitHub:** [@Justy6674](https://github.com/Justy6674)
- **PRD:** [Product Requirements Document](./PRD.md)

---

<p align="center">
  Made for the Australian fragrance community 🇦🇺
</p>
