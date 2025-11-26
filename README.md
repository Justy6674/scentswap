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

## Overview

ScentSwap is a cross-platform mobile app (iOS, Android, and Web) that enables fragrance enthusiasts to swap perfumes and colognes without exchanging money. Built with React Native/Expo for the frontend and Supabase for the backend.

**No buying. No selling. Just swapping.**

The fragrance community has a problem: people accumulate bottles they don't love, decants they've finished exploring, and blind buys that didn't work out. Selling is awkward, prices are disputed, and scammers lurk everywhere.

ScentSwap removes money from the equation entirely. Pure trade. AI-assisted matching. Verified users only. Fair swaps guaranteed.

---

## Features

### Core Features (MVP)

- **User Registration & Verification** - Email sign-up with Australian ID verification tiers
- **Swap Cabinet** - Manage your fragrance collection with photos, fill levels, and conditions
- **Marketplace Browse** - Discover fragrances with filters (concentration, size, scent family)
- **Swap Proposals** - Send and receive trade offers
- **AI Fairness Check** - Automated swap value assessment (70-100% fairness score)
- **In-App Chat** - Negotiate swaps with other users
- **AI Mediation** - Get neutral third-party swap advice
- **Rating System** - Build trust through post-swap reviews
- **Shipping Tracking** - Track your swaps from confirmation to delivery

### User Verification Tiers

| Tier | Requirements | Badge | Privileges |
|------|-------------|-------|------------|
| Unverified | Email only | None | Can browse, cannot swap |
| Verified | ID + Address confirmed | ✓ Verified | Can swap up to $200 value |
| Trusted | 5+ successful swaps, 4.5+ rating | ⭐ Trusted | Unlimited swap value |
| Elite | 20+ swaps, 4.8+ rating, 6+ months | 💎 Elite | Priority matching, featured listings |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo SDK 54) |
| **Navigation** | Expo Router |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **AI Services** | Claude API (for mediation, matching, descriptions) |
| **State Management** | React Context |
| **Styling** | React Native StyleSheet |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/Justy6674/scentswap.git
cd scentswap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the App

```bash
# Web
npm run web

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Development (default web on port 5000)
npm run dev
```

---

## Project Structure

```
scentswap/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Browse marketplace
│   │   ├── cabinet.tsx    # User's fragrance listings
│   │   ├── swaps.tsx      # Active swaps
│   │   └── profile.tsx    # User profile
│   ├── listing/           # Listing screens
│   │   ├── [id].tsx       # Listing details
│   │   └── new.tsx        # Create listing
│   ├── swap/              # Swap screens
│   │   ├── [id].tsx       # Swap details + chat
│   │   └── new.tsx        # Create swap proposal
│   └── profile/           # Profile screens
│       └── [id].tsx       # View other user profiles
├── assets/
│   └── images/            # App icons and logos
├── components/            # Reusable UI components
├── constants/             # Theme colors and config
├── contexts/              # React Context providers
├── lib/                   # Database and API clients
│   ├── supabase.ts       # Supabase client config
│   └── database.ts       # Database operations
├── supabase/             # Supabase configuration
│   └── schema.sql        # Database schema
├── types/                 # TypeScript type definitions
└── package.json
```

---

## Database Schema

The app uses the following Supabase tables:

- **users** - User accounts with verification tiers and ratings
- **listings** - Fragrance listings with photos and details
- **swaps** - Swap proposals and status tracking
- **messages** - Chat messages between users
- **ratings** - Post-swap reviews and scores
- **fragrances** - (Optional) Fragrance catalog reference
- **wishlists** - User fragrance wishlists

See `supabase/schema.sql` for the complete schema.

---

## Color Theme

Based on our brand identity:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Teal | `#6AABA3` | Main buttons, headers, active states |
| Accent Coral | `#E8A898` | Highlights, notifications, CTAs |
| Success Green | `#22C55E` | Confirmations, completed swaps |
| Warning Orange | `#F59E0B` | Alerts, pending states |
| Error Red | `#EF4444` | Errors, declined swaps |

### Light Theme
- Background: `#FFFFFF`
- Card: `#FFFFFF`
- Text: `#1A1A1A`

### Dark Theme
- Background: `#0A0A0B`
- Card: `#18181B`
- Text: `#F9FAFB`

---

## How It Works

### 1. Join & Verify
Sign up with email, verify your Australian identity, and receive your verification badge.

### 2. Build Your Swap Cabinet
Add fragrances you want to swap with photos, fill levels, batch codes, and condition ratings.

### 3. Discover & Match
Browse the marketplace, filter by preferences, and find fragrances you want.

### 4. Propose a Swap
Select bottles to trade and submit a proposal. The AI Fairness Check automatically assesses value balance.

### 5. Negotiate
Chat with the other swapper. Use the AI Mediator for neutral advice on trade fairness.

### 6. Lock & Ship
Both parties confirm, then pack and ship with tracking. Photo verification required.

### 7. Confirm & Rate
Confirm receipt, rate the experience, and build your reputation.

---

## AI Integration

ScentSwap leverages AI for several key features:

### Fairness Engine
Calculates swap fairness using:
- Current market values
- Bottle size and fill level
- Condition rating
- Rarity/discontinuation status
- Batch desirability
- Vintage value

### AI Mediation
Neutral third-party advice during negotiations:
- "Is this a fair trade?" assessments
- Suggestions to balance uneven swaps
- Dispute resolution assistance

### Future: Authenticity Scanning
Photo analysis for known fake markers:
- Font inconsistencies
- Cap/bottle shape anomalies
- Label alignment issues
- Box printing quality

---

## Shipping Guidelines

### Mandatory Packing Protocol
1. Secure the spray nozzle (tape or remove)
2. Wrap bottle in bubble wrap (minimum 2 layers)
3. Place in rigid box with padding
4. Seal outer box securely
5. Photograph packed item before sealing
6. Upload tracking number

### Supported Carriers (Australia)
- Australia Post
- Sendle
- CouriersPlease

---

## Roadmap

### V1 - MVP (Current)
- [x] User registration + verification
- [x] Fragrance listing management
- [x] Marketplace browse with filters
- [x] Swap proposals
- [x] In-app chat
- [x] AI fairness check
- [x] Rating system
- [x] Shipping tracking

### V2 - Enhanced AI
- [ ] AI swap suggestions
- [ ] Wishlist matching notifications
- [ ] Advanced authenticity scanning
- [ ] Decant-specific listings
- [ ] Multi-bottle swap bundles

### V3 - Community
- [ ] Fragrance discovery feed (TikTok-style browsing)
- [ ] Community reviews on specific bottles
- [ ] Swap parties (group swaps, 3-way trades)
- [ ] Retailer verification integration
- [ ] Premium subscription features

### Future
- [ ] Expansion to NZ
- [ ] Expansion to UK/EU (separate markets)

---

## Business Model

### Free Tier
- Unlimited swaps
- Basic AI features
- Standard support

### Premium ($9.99/month)
- Featured listings (appear first in search)
- Advanced AI suggestions
- Detailed swap analytics
- Priority dispute resolution
- No ads

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

**ScentSwap** - [scentswap.com.au](https://scentswap.com.au)

GitHub: [@Justy6674](https://github.com/Justy6674)

---

<p align="center">
  Made with love for the Australian fragrance community
</p>
