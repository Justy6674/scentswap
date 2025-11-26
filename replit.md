# ScentSwap - Fragrance Bartering Marketplace

## Overview
ScentSwap is a cross-platform mobile app (iOS, Android, and Web) for fragrance enthusiasts to swap perfumes and colognes. Built with Expo/React Native for the frontend and Supabase for the backend.

**Australia's First AI-Powered Fragrance Bartering Marketplace**

*Trade scents, not cash*

## Recent Changes
- Nov 26, 2025: Migrated to Supabase backend (removed Express server dependency)
- Nov 26, 2025: Updated brand colors to match logo (Teal #6AABA3, Coral #E8A898)
- Nov 26, 2025: Added comprehensive README.md for GitHub
- Nov 26, 2025: Added Supabase database schema (supabase/schema.sql)
- Nov 26, 2025: Initial MVP implementation with all core features

## Project Architecture

### Frontend (Expo/React Native)
- **Location**: Root directory
- **Framework**: Expo SDK 54 with Expo Router
- **Styling**: React Native StyleSheet with custom color theme
- **State Management**: React Context (AuthContext)
- **Navigation**: Tab-based navigation with 4 main sections

### Backend (Supabase)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth with secure session storage
- **Storage**: Supabase Storage for images (planned)
- **Configuration**: Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

### Key Directories
```
app/
├── (tabs)/          # Tab navigation screens
│   ├── index.tsx    # Browse marketplace
│   ├── cabinet.tsx  # User's fragrance listings
│   ├── swaps.tsx    # Swap management
│   └── profile.tsx  # User profile
├── (auth)/          # Authentication screens
├── listing/         # Listing detail and creation
├── swap/            # Swap detail and creation
└── profile/         # User profile views

assets/images/       # Brand assets (logo, favicon)
components/          # Reusable UI components
constants/           # Theme colors and config
contexts/            # React contexts (Auth)
lib/                 # Database and Supabase clients
supabase/            # Database schema SQL
types/               # TypeScript type definitions
```

### Database Schema
See `supabase/schema.sql` for complete schema:
- **users**: User accounts with verification tiers
- **listings**: Fragrance listings with photos and details
- **swaps**: Swap proposals and status tracking
- **messages**: Chat messages between users
- **ratings**: User reviews and ratings
- **fragrances**: Fragrance catalog (optional)
- **wishlists**: User wishlists

## Running the Project
```bash
npm install
npm run dev
```
Runs Expo web on port 5000.

## Environment Variables
Create `.env.local` with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Color Theme
Based on brand logo:
- Primary Teal: #6AABA3
- Accent Coral: #E8A898
- Background: #FFFFFF (Light) / #0A0A0B (Dark)
- Card: #FFFFFF (Light) / #18181B (Dark)

## User Preferences
- None recorded yet

## GitHub Repository
- Repository: github.com/Justy6674/scentswap
- See README.md for complete documentation

## Notes
- AI fairness check currently uses mock random scoring (70-100%)
- Real AI integration would require Claude/OpenAI API
- Mobile builds require Expo EAS or native development setup
- Web version works in browser for testing
