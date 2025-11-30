# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScentSwap is Australia's first AI-powered fragrance bartering marketplace built with React Native and Expo. It's a cashless peer-to-peer marketplace where users trade fragrances instead of buying/selling them.

## Tech Stack

- **Frontend**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI Services**: Claude API (for fairness scoring, mediation, matching)
- **Authentication**: Outseta (not Supabase Auth)
- **Testing**: Jest, Playwright
- **TypeScript**: Strict mode enabled

## Development Commands

```bash
# Development
npm run dev          # Start web development server on port 5000
npm run start        # Start Expo development server
npm run web          # Start web version on port 5000
npm run ios          # Start iOS simulator
npm run android      # Start Android emulator

# Testing
npm test             # Run Jest tests with watch mode
npm run lint         # Run ESLint
npx playwright test  # Run Playwright e2e tests (tests run against localhost:5000)

# Building
npm run build:web    # Build for web deployment

# Project Reset (if needed)
npm run reset-project # Reset project to clean state
```

## Project Structure

```
app/                 # Expo Router screens (file-based routing)
├── (auth)/         # Authentication screens
├── (tabs)/         # Main tab navigation
│   ├── index.tsx   # Home/Discover
│   ├── cabinet.tsx # My Cabinet
│   ├── swaps.tsx   # Active Swaps
│   ├── profile.tsx # User Profile
│   ├── search.tsx  # Search & filters (tab)
│   ├── assistant.tsx # AI Assistant
│   ├── analytics.tsx # Analytics dashboard
│   └── admin.tsx   # Admin dashboard
├── listing/        # Listing details & creation
├── swap/           # Swap details & creation
├── profile/        # Other user profiles
├── search.tsx      # Global search page
├── browse.tsx      # Browse fragrances
└── faq.tsx         # FAQ page

components/         # Reusable UI components
├── search/         # Search-specific components
contexts/          # React Context providers
lib/               # Core utilities
├── supabase.ts    # Supabase client (SSR-safe)
├── database.ts    # Database operations
├── ai.ts          # Claude API integration
├── admin.ts       # Admin authentication
├── valuation.ts   # AI valuation services
├── ai-services.ts # Additional AI services
├── searchAI.ts    # AI-powered search
├── aiAssistant.ts # AI assistant functionality
├── marketIntelligence.ts # Market analysis
├── advancedAnalytics.ts # Analytics processing
└── vectorDatabase.ts # Vector database for AI

supabase/          # Database schema & migrations
types/             # TypeScript type definitions
```

## Architecture Notes

### Authentication System
- **Uses Outseta NOT Supabase Auth** - Critical distinction
- Outseta provides hosted auth pages and subscription management
- Admin access controlled by email whitelist in `lib/admin.ts`
- Session persistence via localStorage (web) with SSR safety

### Database Schema Key Points
- `fragrance_master` table is the core asset (24K+ fragrances)
- Users table separate from auth (Outseta handles auth)
- JSONB fields for flexible metadata storage
- Full-text search with tsvector indexing
- Row Level Security (RLS) policies enabled

### SSR-Safe Supabase Client
The `lib/supabase.ts` file has specific SSR handling:
- Only creates client on browser side (`typeof window !== 'undefined'`)
- Uses localStorage adapter instead of SecureStore for web compatibility
- Singleton pattern with `getSupabase()` function

### AI Integration
- **Claude API** for fairness scoring and mediation
- **AI Enhancement Engine** for fragrance data enrichment
- **Valuation Services** for trade matching
- **Vector Database** for similarity search and recommendations
- **Market Intelligence** for pricing and trend analysis
- **AI Assistant** for user guidance and support
- **Advanced Analytics** for platform insights

## Environment Configuration

Required environment variables:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Setup

- **Jest**: Unit testing with expo preset
- **Playwright**: E2E testing configured for mobile and desktop
- Tests run against localhost:5000 (web version)
- Mobile testing includes Pixel 5 and iPhone 12 viewports

## Admin Features

Admin access controlled by hardcoded email whitelist:
- Edit `lib/admin.ts` to add new admins
- Admin features include user management, dispute resolution, platform statistics
- Uses same authentication flow as regular users (via Outseta)

## Key Development Notes

1. **Always use `getSupabase()` function, never direct `supabase` export**
2. **Outseta auth flow - do not implement Supabase Auth**
3. **Mobile-first design with React Native components**
4. **File-based routing with Expo Router**
5. **TypeScript strict mode - avoid `any` types**
6. **Fragrance master database is the core business asset**

## Outseta Integration Rules

**CRITICAL: Outseta is the ONLY authentication provider. DO NOT use Supabase Auth.**

- Use direct URL redirects for auth, not widget APIs
- Post Login URL: redirects to main app
- Post Sign Up URL: leave empty (Outseta handles confirmation)
- Token storage: localStorage for session persistence
- Admin whitelist in `lib/admin.ts` for role-based access

**Important URLs:**
- Login: `https://scentswap.outseta.com/auth?widgetMode=login#o-anonymous`
- Register: `https://scentswap.outseta.com/auth?widgetMode=register#o-anonymous`
- Profile: `https://scentswap.outseta.com/profile#o-authenticated`

**Plan UIDs:**
- Free: `z9MP7yQ4`
- Premium: `vW5RoJm4` ($9.99/month AUD)
- Elite: `aWxr2rQV` ($19.99/month AUD)

See `.cursor/rules/outseta.mdc` for detailed integration rules.

## Common Patterns

### Database Operations
```typescript
const supabase = getSupabase();
if (!supabase) {
  // Handle no client case
  return;
}
// Proceed with operations
```

### Admin Check
```typescript
import { isAdmin } from '@/lib/admin';

const userIsAdmin = isAdmin(user?.email);
```

### Navigation
```typescript
import { router } from 'expo-router';

router.push('/listing/123');
router.replace('/auth/login');
```

This is a React Native app with web deployment capabilities - ensure any code additions are compatible with both platforms.

## Core Business Asset: Fragrance Master Database

**24,000+ verified fragrances** - This is ScentSwap's competitive advantage:
- Multi-source data enhancement (Fragrantica, brand websites, user uploads)
- Smart upsert system prevents duplicates using URL-based identification
- Rich metadata: notes, ratings, perfumers, families, performance metrics
- Full-text search with tsvector indexing
- JSONB fields for flexible metadata storage

**Key files:**
- Database schema: `supabase/schema.sql`
- Enhancement engine: `lib/ai-enhancement-engine.ts`
- Search functionality: `lib/searchAI.ts`

## AI Services Architecture

Multiple AI services power the platform:
- **Fairness Engine**: Ensures balanced trades
- **Valuation Service**: Estimates fragrance values
- **Enhancement Engine**: Enriches fragrance data
- **Search AI**: Intelligent search and recommendations
- **Market Intelligence**: Pricing and trend analysis
- **Assistant**: User guidance and support

## Expo Configuration Notes

- **New Architecture**: Enabled (`"newArchEnabled": true`)
- **Typed Routes**: Enabled for type-safe navigation
- **Permissions**: Camera and photo library access configured
- **Bundle ID**: `com.scentswap.app`
- **Splash Screen**: Custom logo with teal background (`#6AABA3`)

## Available Anthropic Skills

The following skills are available from the Anthropic Skills repository located at `/Users/jb-downscale/anthropic-skills/`:

### Creative & Design Skills:
- **algorithmic-art** - Generative art using p5.js with seeded randomness
- **canvas-design** - Beautiful visual art in .png and .pdf formats
- **slack-gif-creator** - Animated GIFs optimized for Slack constraints

### Development & Technical Skills:
- **artifacts-builder** - Complex claude.ai HTML artifacts using React, Tailwind CSS, shadcn/ui
- **mcp-server** - Creating high-quality MCP servers for external API integration
- **webapp-testing** - Local web application testing using Playwright

### Enterprise & Communication Skills:
- **brand-guidelines** - Anthropic's official brand colours and typography
- **internal-comms** - Status reports, newsletters, and FAQs
- **theme-factory** - 10 professional themes plus custom theme generation

### Document Skills (Production-Ready):
- **docx** - Word documents with tracked changes, comments, formatting
- **pdf** - PDF manipulation, extraction, merging, splitting, forms
- **pptx** - PowerPoint presentations with layouts, templates, charts
- **xlsx** - Excel spreadsheets with formulas, formatting, data analysis

### Meta Skills:
- **skill-creator** - Guide for creating effective custom skills
- **template-skill** - Basic template for new skills

### Usage Examples:
```bash
# Use PDF skill for document generation
"Use the PDF skill to generate a professional report from this data"

# Use webapp-testing skill for UI verification
"Use the webapp-testing skill to test the admin dashboard"

# Use document skills for business documents
"Use the docx skill to create a project proposal document"
```

### Skill Integration Notes:
- Skills complement existing MCP servers (Supabase, Context7, etc.)
- Document skills work alongside FabianGenell PDF MCP for comprehensive workflows
- Webapp-testing skill enhances Playwright MCP testing capabilities
- All skills available globally across Claude Code projects