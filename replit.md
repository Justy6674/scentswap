# ScentSwap - Fragrance Bartering Marketplace

## Overview
ScentSwap is a cross-platform mobile app (iOS, Android, and Web) for fragrance enthusiasts to swap perfumes and colognes. Built with Expo/React Native for the frontend and Express.js with PostgreSQL for the backend.

## Recent Changes
- Nov 26, 2025: Initial MVP implementation with all core features
- Authentication system with login/register screens
- Marketplace browsing with concentration filters
- Swap Cabinet for managing user listings
- Swap proposal system with AI fairness check
- Messaging/chat system for negotiations
- Rating and review system
- User profiles with verification tiers

## Project Architecture

### Frontend (Expo/React Native)
- **Location**: Root directory
- **Framework**: Expo SDK 54 with Expo Router
- **Styling**: React Native StyleSheet with custom color theme
- **State Management**: React Context (AuthContext)
- **Navigation**: Tab-based navigation with 4 main sections

### Backend (Express.js)
- **Location**: `/server` directory
- **Port**: 3000 (internal)
- **Database**: PostgreSQL with pg client
- **Authentication**: bcrypt password hashing

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

components/          # Reusable UI components
contexts/            # React contexts (Auth)
lib/                 # Database client
types/               # TypeScript type definitions
server/              # Express backend API
```

### Database Schema
- **users**: User accounts with verification tiers
- **listings**: Fragrance listings with photos and details
- **swaps**: Swap proposals and status tracking
- **messages**: Chat messages between users
- **ratings**: User reviews and ratings
- **fragrances**: Fragrance catalog (optional)
- **wishlists**: User wishlists

## Running the Project
The project runs with `npm run dev` which starts both:
1. Express backend on port 3000
2. Expo web on port 5000

## Color Theme
- Primary: #8B5CF6 (Purple/Violet)
- Accent: #EC4899 (Pink)
- Background: #FFFFFF (Light) / #0A0A0B (Dark)
- Card: #F4F4F5 (Light) / #18181B (Dark)

## User Preferences
- None recorded yet

## Notes
- AI fairness check currently uses mock random scoring (70-100%)
- Real AI integration would require OpenAI or similar API
- Mobile builds require Expo EAS or native development setup
- Web version works in browser for testing
