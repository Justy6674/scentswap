# ScentSwap — Product Requirements Document

> **Version:** 2.0  
> **Last Updated:** November 2025  
> **Target:** Australia-First, AI-Powered Fragrance Trading Platform  
> **Stack:** React Native (Expo), Supabase, Claude AI

---

## Table of Contents

1. [Vision & Philosophy](#vision--philosophy)
2. [Build Priority Order](#build-priority-order)
3. [Core User Experience](#core-user-experience)
4. [Navigation Structure](#navigation-structure)
5. [My Cabinet (Inventory)](#my-cabinet-inventory)
6. [Adding a Bottle (Photo + Authenticity Flow)](#adding-a-bottle-photo--authenticity-flow)
7. [Search & Discovery](#search--discovery)
8. [Listing Detail Page](#listing-detail-page)
9. [Swap Proposal Flow](#swap-proposal-flow)
10. [Chat & AI Mediator](#chat--ai-mediator)
11. [Lock, Ship & Rate](#lock-ship--rate)
12. [Trust & Safety System](#trust--safety-system)
13. [AI Integration Points](#ai-integration-points)
14. [The Fairness Algorithm](#the-fairness-algorithm)
15. [Technical Architecture](#technical-architecture)
16. [Database Schema](#database-schema)
17. [Business Model](#business-model)
18. [Roadmap](#roadmap)

---

## Vision & Philosophy

ScentSwap is Australia's first dedicated AI-powered fragrance swapping marketplace. It unlocks the liquidity of millions of dollars worth of "dead stock" (unused perfume bottles) sitting in consumers' homes.

**The user should feel:**
> "I open the app, see a clean feed of real bottles from other Australians, instantly know who I can trust, what's a fair trade, and exactly what I need to send. I don't argue about money, I don't stress about fakes, and the app does most of the thinking for me."

### Core Principles

1. **No Money, No Drama** — Swapping eliminates price haggling and payment scams
2. **AI as the Neutral Party** — Mediates fairness, suggests matches, verifies authenticity
3. **Trust is Everything** — Verification, ratings, and swap history build community trust
4. **Australian First** — Accountable users, reasonable shipping, local community

### Why This Works

- Fragrance community is passionate — they LOVE talking about, sharing, and trading
- Current alternatives suck — Facebook groups are sketchy, eBay has fees and scammers
- Swapping removes friction — No "is $80 fair?" debates, just trade
- AI solves the trust problem — Neutral, instant, consistent fairness checks

---

## Build Priority Order

Build these features in this exact sequence:

| Priority | Feature | Description |
|----------|---------|-------------|
| 1 | **Core Swapping Engine** | Basic swap proposal, accept/decline flow |
| 2 | **User Profiles + Verification** | Tiers display, badges, basic profile |
| 3 | **Cabinet (Upload Bottles)** | Add listings with photos, details |
| 4 | **Photo Authenticity AI** | Capture flow, basic AI checks |
| 5 | **Matchmaker + Fairness Engine** | AI-powered swap suggestions, value scoring |
| 6 | **Swap Proposal Flow** | Full UI with fairness meter |
| 7 | **Chat + AI Mediator** | In-swap messaging with @ScentBot |
| 8 | **Shipping + Status Tracking** | Lock flow, tracking numbers, status updates |
| 9 | **Ratings + Trust Metrics** | Post-swap reviews, reputation building |
| 10 | **Premium Features Toggle** | Subscription gating |

**Strategy:** Web app first → Mobile later via React Native/Expo

---

## Core User Experience

The app flows around three core ideas:
1. **"My Cabinet"** — What I'm willing to trade
2. **"Other Swappers"** — What's available
3. **"Proof This Bottle is Real"** — Trust through verification

### Design Principles

- **Safe:** Verified people, clear photos, tracking, reviews
- **Simple:** Add bottle → app helps with everything
- **Fair:** AI tells you honestly if a trade is balanced
- **Fun:** Satisfying to see your "Shelf of Regret" turn into new toys

---

## Navigation Structure

**Bottom Tab Bar (5 tabs):**

| Tab | Icon | Screen |
|-----|------|--------|
| Home | 🏠 | Discover feed, curated collections |
| Search | 🔍 | Full search with filters |
| Cabinet | 📦 | My inventory for swap |
| Swaps | 🔄 | Active negotiations |
| Profile | 👤 | Trust badges, history, settings |

### Home Screen

- **Curated Cards:** "New in your state", "Loud woody bangers", "Fresh summer swaps"
- **Quick Chips:** Jump into filters — Niche, Designer, Unisex, Beast Mode, Office Safe
- **Discovery toggle:** "Show only people who want what I have"

---

## My Cabinet (Inventory)

This is the heart of the app. Should feel like **Aromoshelf / Parfumo** but trade-focused.

### Cabinet Screen Layout

- **Big plus button:** "Add a scent to trade"
- **Grid of bottles** showing:
  - Photo
  - Name
  - Size
  - Fill %
  - Your tag (e.g., "will trade only for niche", "high priority swap")

### Cabinet Filters

| Filter | Options |
|--------|---------|
| Status | Active / Locked / Archived |
| Segment | Designer / Niche / Indie / Decant |
| Season | Summer / Winter / All Year |
| Performance | Soft / Moderate / Loud / Beast Mode |

### Verification Progress Meter

Each listing shows verification level:

| Level | Requirements |
|-------|-------------|
| **Basic** | Just a front photo |
| **Strong** | Front + sprayer + batch code |
| **Verified-ish** | Passed all AI checks + good user reputation |

---

## Adding a Bottle (Photo + Authenticity Flow)

### Step-by-Step Capture Flow

The goal: Make it fast and guided, not like homework. Big buttons, example photos, ghost overlays.

#### Step 1: Basic Details
- Search field with autocomplete from database
- Choose concentration (EDT, EDP, Parfum)
- Choose size (30 / 50 / 75 / 100 / 125 / 200 ml)

#### Step 2: Mandatory Authenticity Photos

| Photo | Guidance | Purpose |
|-------|----------|---------|
| **Front of bottle** | "Fill the frame with the bottle front; avoid glare" | Primary identification |
| **Sprayer top off** | "Pop the cap and show the sprayer and neck" | Catches fake hardware issues |
| **Base of bottle** | "Snap the bottom with batch code visible" | Batch verification |
| **Box and serial** | "Show box with serial/batch code and barcode" | Cross-reference verification |

#### Optional: Proof-of-Life
- Bottle next to handwritten note with username + today's date

#### Step 3: AI Auto-Check Summary

As each photo is taken, AI runs quick checks:

```
✓ Image quality: OK
✓ Batch code found: Yes
✓ Matches expected format for this brand: Likely
```

**Important:** Language is soft, never claims absolute authenticity:
- ✅ "Nothing obviously wrong detected"
- ⚠️ "Some details don't match usual references, trade with caution"

#### Step 4: Condition & Fill Level

- **Slider for fill level (%)** — AI can suggest from photo
- **Condition options:**
  - New (sprayed 0–2 times)
  - Like New (>90% full, minor use)
  - Good (70–90%, light wear)
  - Worn (<70%, obvious wear)

#### Step 5: Swap Preferences

- What will you consider for this scent?
  - Exact titles
  - Style preferences ("dark ambers, boozy gourmands, niche only")
- Swap ratio: "1:1 only" / "Happy with 1:2 if fair" / "Will add decant to balance"
- Value band auto-calculated

#### Step 6: Visibility & Status

- **Open for swap** — Active in marketplace
- **Maybe swap — ask me** — Visible but requires inquiry
- **Not for swap** — Collection only

---

## Search & Discovery

Search should feel like a **Spotify filter drawer**, not a boring form.

### Search Screen Layout

1. **Top search bar:** Brand/name/general text
2. **Horizontal chips:** Quick filters
3. **"More filters" button:** Opens full filter sheet
4. **Results:** Card grid with key info

### Quick Filter Chips

```
[Designer] [Niche] [Indie] [Decant]
[Men] [Women] [Unisex] [Don't care]
[Woody] [Fruity] [Floral] [Fresh] [Gourmand] [Metallic]
```

### Full Filter Sheet

| Category | Options |
|----------|---------|
| Market Segment | Designer, Niche, Indie, Clone, Decant |
| Gender | Mens, Womens, Unisex, Don't care |
| Family | Woody, Floral, Oriental, Fresh, Citrus, Gourmand, Oud |
| Accords | Vanilla, Leather, Tobacco, Incense, etc. |
| Notes | Specific ingredient search |
| Performance | Soft, Moderate, Loud, Beast Mode |
| Season | Summer, Winter, All Year |
| Occasion | Office, Date Night, Gym, Clubbing, Casual, Signature |
| State/Location | Same state or nationwide |
| Value Range | Low, Mid, High, Ultra |
| Fill Level | >70% only, etc. |
| Condition | Like New or better |
| User Trust Level | Verified, Trusted, Elite only |
| AI Verified | High authenticity confidence only |

### AI "Vibe Search"

Free text input that AI converts to structured filters:

**User types:** "beast mode woody, unisex, clubbing"

**AI converts to:**
```json
{
  "performance": "beast_mode",
  "family": "woody", 
  "gender": "unisex",
  "occasion": "clubbing"
}
```

### Discovery Toggle

"Show only people who want what I have"
- Uses your cabinet + their wishlists to surface mutual matches

### Saved Filters

Users can save filter sets:
- "Summer freshies"
- "Dark winter vanillas"
- "Niche only beast mode"

### Alerts

"Notify me when a [Vanilla, Niche, Winter] scent in [High value band] is listed"

---

## Listing Detail Page

When user taps a listing card:

### Hero Section
- Big bottle photo (swipeable gallery)
- Brand + fragrance name
- Size, fill %, condition

### Tab Navigation

| Tab | Content |
|-----|---------|
| **Details** | Family, key accords, performance, season, owner notes |
| **Owner** | Profile card, badge, rating, swap history |
| **Authenticity** | Proof photos gallery, AI confidence score |

### Authenticity Info

- Gallery: front, sprayer, batch/box photos
- AI assessment line: "Batch code and bottle style look consistent with typical X bottles (not guaranteed)"

### What Owner Wants

- Exact scents they're hunting
- Note profiles ("dark vanilla ambers")
- Swap rules (1:1 only, will consider decants)

### Action Buttons

- **"See what I could offer"** — Opens your cabinet filtered
- **"Propose Swap"** — Starts proposal flow

---

## Swap Proposal Flow

### Step 1: Select Your Offer

Modal shows YOUR cabinet with filters:
- "Show only niche"
- "Show only decants"
- Value range

Select 1–3 of your scents.

### Step 2: Real-Time Fairness Meter

As you select bottles:

```
Your side:    140 points
Their side:   120 points
━━━━━━━━━━━━━━━━━━━━━━━━
Fairness:     93% — Good deal for both ✓
```

**If unbalanced:**
- "This is heavily in your favour"
- "You're offering more. You could remove X or ask them to add Y"

### Step 3: Add Message

Template suggestion:
> "Hey, I'd love to swap my [X] and [Y] for your [Z]. I've looked after them well, see photos in my cabinet. Happy to discuss and adjust if needed."

### Step 4: Send Proposal

- Big clear button: "Send swap proposal"
- Items soft-locked (can't use in other new proposals)
- Enters "Pending" state

---

## Chat & AI Mediator

### Swap Chat Room

- **Top:** Summary card (what's being swapped, fairness score, status)
- **Below:** Chat bubbles between users
- **@ScentBot:** Inline AI suggestions

### @ScentBot Capabilities

**User asks:** "Is this bottle definitely real?"
> **ScentBot:** "Based on the photos and batch data, authenticity confidence is 91%. No obvious fake markers detected. Remember to check serial number matches box and bottle in the photos."

**User asks:** "Do you think this is a fair trade?"
> **ScentBot:** "Your side is approximately 120 points, their side is about 118 points. That's a 96% fairness score – very balanced."

**User asks:** "What can I add to balance this?"
> **ScentBot:** Suggests items from your cabinet that would balance the trade.

### Safety Blocks

**If someone shares bank details:**
> "ScentSwap is for cashless swaps only. Please don't send money or share bank details."

**If someone suggests off-platform:**
> "For safety, we recommend all communication and trading stays inside ScentSwap. Off-platform deals are not protected."

---

## Lock, Ship & Rate

### Status: LOCKED

Once both parties accept:
- Inventory items hard-locked (cannot use in other swaps)
- Addresses revealed
- Shipping flow begins

### Shipping Step-by-Step

1. **Confirm address** (hidden until swap is locked)
2. **Packing guidelines displayed:**
   - Remove cap and secure sprayer (or tape)
   - Bubble wrap bottle multiple times
   - Place in rigid box with padding
   - Seal box properly
3. **Photo of packed bottle** before sealing — upload to swap record
4. **Enter tracking number** (or integrated label if carrier API built)

### Status Tracking

```
Packed → Shipped → In Transit → Delivered
```

### Confirm Receipt

Both users prompted to confirm when delivered.

### Rate the Experience

| Category | Question |
|----------|----------|
| Accuracy | Was it as described? |
| Packaging | Was it safe? |
| Communication | Were they responsive? |
| Timeliness | Did they ship promptly? |
| Overall | Would you swap with them again? |

Written review optional.

### Profile Display

- Star rating (1.0 - 5.0)
- Number of completed swaps
- Percentage positive ("98% positive")
- Badge (Verified / Trusted / Elite)

---

## Trust & Safety System

### User Verification Tiers

| Tier | Requirements | Badge | Privileges |
|------|-------------|-------|------------|
| **Unverified** | Email only | None | Can browse, cannot swap |
| **Verified** | ID + Address confirmed | ✓ Verified | Swap up to $200 value |
| **Trusted** | 5+ successful swaps, 4.5+ rating | ⭐ Trusted | Unlimited swap value |
| **Elite** | 20+ swaps, 4.8+ rating, 6+ months | 💎 Elite | Priority matching, featured listings |

### Anti-Scam Measures

- ✅ Mandatory authenticity photos for all listings
- ✅ AI authenticity check on submission
- ✅ Batch code database cross-reference
- ✅ Shipping tracking mandatory
- ✅ Both parties must confirm receipt
- ✅ Dispute resolution with AI + human review
- ✅ Banned user database
- ✅ Suspicious activity auto-flagging

### Visibility Penalty

Listings without proper photos or authenticity signals:
- Show lower in search
- Marked as "Unverified Listing"
- Some users filter them out

### Dispute Flow

If bottle arrives fake or misrepresented:
1. User files dispute with photos
2. AI + human review
3. Can mark item as fake
4. Warn or ban the trader
5. Protect ratings for victim

---

## AI Integration Points

| Feature | AI Role |
|---------|---------|
| **Authenticity Scanning** | Analyses photos for fake markers, batch codes, packaging inconsistencies |
| **Scent Profiling** | Auto-generates descriptions, notes pyramid, "if you like this..." suggestions |
| **Fair Value Engine** | Calculates swap fairness using market prices, rarity, fill level, condition |
| **Match Suggestions** | "You have X, they want X, they have Y, you want Y" — surfaces mutual matches |
| **Swap Mediator** | Neutral third party in negotiations, suggests balanced trades |
| **Listing Assistant** | Helps write descriptions, suggests fill level from photos |
| **Fraud Detection** | Flags suspicious behaviour: new accounts wanting high-value swaps, repeated disputes |
| **Vibe Search** | Converts natural language to structured filters |

---

## The Fairness Algorithm

Not all bottles are equal. A 10ml decant isn't worth a 100ml full presentation.

### Calculation Formula

```
Points = (MarketPrice × FillLevel) × DemandMultiplier × VintageMultiplier
```

### Factors Considered

| Factor | Weight |
|--------|--------|
| Current market value | High |
| Bottle size | High |
| Fill level percentage | High |
| Condition (New/Like New/Good/Fair) | Medium |
| Rarity/discontinuation status | Medium |
| Batch desirability | Low-Medium |
| Age (vintage value vs. degradation) | Low |

### Output

- **Swap Value Score** for each item
- **Comparison** showing if trade is balanced
- **Suggestions** to balance: "Add a 10ml decant of X to make this fair"

### User Override

Users CAN accept "unfair" swaps knowingly:
- System flags but doesn't block
- "I know this isn't equal value but I really want this bottle" — fine, proceed

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native (Expo SDK 54) |
| **Navigation** | Expo Router (file-based) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **AI Services** | Claude API (mediation, matching, fairness, descriptions) |
| **Image Analysis** | Claude Vision or custom model for authenticity |
| **ID Verification** | GreenID or similar Australian KYC provider |
| **State Management** | React Context |
| **Styling** | React Native StyleSheet |
| **Hosting** | Vercel (web) + App Store + Google Play |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts, verification tiers, ratings, shipping addresses |
| `listings` | Fragrance listings with photos, fill levels, search facets |
| `swaps` | Trade proposals, status tracking, fairness scores |
| `messages` | Chat between swappers, AI mediation flags |
| `ratings` | Post-swap reviews |
| `wishlists` | User fragrance wants |
| `fragrances` | Reference catalog for autocomplete |
| `fragrance_meta` | Extended metadata (accords, notes, family) |

### Listings Search Facets

```sql
segment_type     -- designer, niche, indie, clone, decant
gender_marketing -- mens, womens, unisex
family           -- woody, floral, oriental, etc.
accords          -- TEXT[] array
notes            -- TEXT[] array
performance_level -- soft, moderate, loud, beast_mode
season_tags      -- TEXT[] array
occasion_tags    -- TEXT[] array
value_points     -- INTEGER for fairness calculation
state            -- Australian state for location filtering
```

See `supabase/schema.sql` for complete schema with RLS policies.

---

## Business Model

### Free Tier
- Unlimited swaps
- Basic AI features
- Standard listing visibility

### Premium ($9.99/month)
- Featured listings (appear first in search)
- Advanced AI suggestions
- Detailed swap analytics
- Priority dispute resolution
- "Batch Hunter" alerts
- No ads

### Boosts (One-time)
- "Top of Feed" for 48 hours ($2.99)
- Promote Listing ($4.99)

### Future Revenue
- Partner fragrance house promotions
- Affiliate links to retailers
- Insurance partnerships

---

## Roadmap

### V1 — MVP (Current)
- [x] User registration + verification tiers
- [x] Cabinet management
- [x] Marketplace browse with filters
- [x] Swap proposals
- [x] Basic chat
- [x] AI fairness check
- [x] Rating system
- [x] Shipping tracking

### V2 — Enhanced AI
- [ ] AI swap suggestions ("You might like this trade")
- [ ] Wishlist matching notifications
- [ ] Advanced authenticity scanning
- [ ] Decant-specific listings
- [ ] Multi-bottle swap bundles
- [ ] Vibe search (natural language)

### V3 — Community
- [ ] Fragrance discovery feed (TikTok-style)
- [ ] Community reviews on specific bottles
- [ ] Swap parties (group swaps, 3-way trades)
- [ ] Australian retailer verification integration
- [ ] Premium subscription features

### Future
- [ ] Expansion to NZ
- [ ] Expansion to UK/EU (separate markets)

---

## References

- [Aromoshelf](https://aromoshelf.com) — AI Scent Wardrobe inspiration
- [Parfumo](https://parfumo.app) — Collection management UX
- [Fragrantica](https://fragrantica.com) — Fragrance database integration
- [UX Filter Best Practices](https://uxdesign.cc/crafting-a-kickass-filtering-ux-beea1798d64b)

---

## Contact

**ScentSwap** — [scentswap.com.au](https://scentswap.com.au)

GitHub: [@Justy6674](https://github.com/Justy6674)

