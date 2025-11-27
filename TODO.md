# ScentSwap - Build TODO

> **Last Updated:** November 2025  
> **Reference:** [PRD.md](./PRD.md) for full specifications

---

## Build Status Overview

| Priority | Feature | Status | Notes |
|----------|---------|--------|-------|
| 1 | Core Swapping Engine | 🟡 Partial | Basic flow exists, needs refinement |
| 2 | User Profiles + Verification | 🟡 Partial | Tiers display, verification screens missing |
| 3 | Cabinet (Upload Bottles) | 🟡 Partial | Basic add works, guided capture flow missing |
| 4 | Photo Authenticity AI | 🔴 Not Started | No AI photo analysis |
| 5 | Matchmaker + Fairness Engine | 🔴 Fake | Using random scores, needs real calculation |
| 6 | Swap Proposal Flow | 🟡 Partial | Works but no real-time fairness meter |
| 7 | Chat + AI Mediator | 🔴 Fake | Mock responses, no Claude integration |
| 8 | Shipping + Status Tracking | 🔴 Not Started | No tracking number entry, no status flow |
| 9 | Ratings + Trust Metrics | 🟡 Partial | Rating form exists, display works |
| 10 | Premium Features Toggle | 🔴 Not Started | No subscription logic |

---

## Priority 1: Core Swapping Engine

### ✅ Done
- [x] Swap proposal creation (`app/swap/new.tsx`)
- [x] Swap status states in database schema
- [x] Basic accept/decline flow (`app/swap/[id].tsx`)
- [x] Swap list view (`app/(tabs)/swaps.tsx`)

### 🔴 TODO
- [ ] **Soft-lock listings** when included in pending proposal
  - Prevent same listing being offered in multiple active proposals
  - Add `locked_in_swap_id` column to listings table
- [ ] **Hard-lock on acceptance** - Mark listings as unavailable when swap is locked
- [ ] **Cancel flow** - Allow initiator to cancel pending proposals
- [ ] **Counter-offer flow** - Recipient can modify proposed items
- [ ] **Multi-bottle selection UI** - Better UX for selecting multiple items

---

## Priority 2: User Profiles + Verification

### ✅ Done
- [x] Profile screen with stats (`app/(tabs)/profile.tsx`)
- [x] Verification tier badge display
- [x] Rating display

### 🔴 TODO
- [ ] **Create `/profile/edit.tsx`** - Edit username, bio, avatar
- [ ] **Create `/profile/address.tsx`** - Shipping address management
- [ ] **Create `/profile/verification.tsx`** - ID verification flow
  - Upload driver's license / Medicare card
  - Address verification
  - Progress through tiers
- [ ] **Public profile view** - Fix `app/profile/[id].tsx` to show other users' profiles
- [ ] **Verification API integration** - GreenID or similar Australian KYC

---

## Priority 3: Cabinet (Upload Bottles)

### ✅ Done
- [x] Basic listing creation (`app/listing/new.tsx`)
- [x] Photo upload from gallery/camera
- [x] Fill level selector
- [x] Condition selector
- [x] Concentration selector

### 🔴 TODO
- [ ] **Guided photo capture flow** (per PRD Step 2)
  - Step 1: Front of bottle (mandatory)
  - Step 2: Sprayer top off (optional, rewarded)
  - Step 3: Base with batch code (optional, rewarded)
  - Step 4: Box and serial (optional, rewarded)
  - Add overlay guides and example images
- [ ] **Verification progress meter** on each listing
  - Basic / Strong / Verified-ish based on photos provided
- [ ] **Fragrance autocomplete** from `fragrance_meta` table
  - Auto-fill family, accords, notes when fragrance selected
- [ ] **Swap preferences per listing**
  - What you'll accept (specific fragrances or style preferences)
  - Swap ratio (1:1 only, 1:2 ok, will add decant)
- [ ] **Listing status management**
  - Open for swap / Maybe swap / Not for swap
  - Archive old listings
- [ ] **Edit existing listings** - Currently no edit screen
- [ ] **Delete listing confirmation**

---

## Priority 4: Photo Authenticity AI

### 🔴 TODO (Not Started)
- [ ] **Claude Vision integration** for photo analysis
  - Check image quality (blur, lighting)
  - Detect batch code presence and readability
  - Compare bottle shape to known genuine examples
  - Check font consistency on labels
- [ ] **AI check summary display**
  ```
  ✓ Image quality: OK / Poor
  ✓ Batch code found: Yes / No
  ✓ Matches expected format: Likely / Unclear
  ```
- [ ] **Soft language** - Never claim absolute authenticity
  - "Nothing obviously wrong detected"
  - "Some details don't match usual references, trade with caution"
- [ ] **Store AI confidence score** per listing
- [ ] **Filter by AI verification level** in search

---

## Priority 5: Matchmaker + Fairness Engine

### 🔴 Current State: FAKE DATA
```typescript
// lib/database.ts line 262 - Using random scores!
const fairnessScore = Math.floor(Math.random() * 30) + 70;
```

### 🔴 TODO
- [ ] **Real fairness calculation** using:
  - Market value (from `estimated_value` or external source)
  - Fill level percentage
  - Condition multiplier
  - Rarity/discontinuation status
  - Batch desirability (future)
- [ ] **Points formula implementation**
  ```
  Points = (MarketPrice × FillLevel) × DemandMultiplier × VintageMultiplier
  ```
- [ ] **AI-powered match suggestions**
  - "User X has what you want and wants what you have"
  - Surface mutual matches on home screen
- [ ] **Wishlist matching**
  - Create wishlist table entries
  - Notify when wishlist item is listed
- [ ] **Balance suggestions**
  - "Add a 10ml decant to make this fair"
  - "Remove X to balance this trade"

---

## Priority 6: Swap Proposal Flow

### ✅ Done
- [x] Select items from cabinet
- [x] Basic fairness score display
- [x] Submit proposal

### 🔴 TODO
- [ ] **Real-time fairness meter** as items are selected
  ```
  Your side:    140 points
  Their side:   120 points
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Fairness:     93% — Good deal for both ✓
  ```
- [ ] **Imbalance warnings**
  - "This is heavily in your favour"
  - "You're offering more. You could remove X or ask them to add Y"
- [ ] **Filter your cabinet** in proposal modal
  - Show only niche
  - Show only decants
  - Value range filter
- [ ] **Message template** suggestion when proposing

---

## Priority 7: Chat + AI Mediator

### 🔴 Current State: FAKE DATA
```typescript
// lib/database.ts line 360 - Mock responses!
const responses = [
  'Based on the current market values...',
  // ... hardcoded strings
];
const response = responses[Math.floor(Math.random() * responses.length)];
```

### 🔴 TODO
- [ ] **Claude API integration** for @ScentBot
  - "Is this a fair trade?" → Real AI assessment
  - "What can I add to balance this?" → Suggestions from cabinet
  - "Is this bottle authentic?" → Photo analysis
- [ ] **Safety blocks**
  - Detect bank details → Block and warn
  - Detect off-platform suggestions → Warning message
- [ ] **AI message styling** - Different bubble style for @ScentBot
- [ ] **Quick action buttons** for common questions
- [ ] **Real-time chat** with Supabase Realtime subscriptions

---

## Priority 8: Shipping + Status Tracking

### 🔴 TODO (Not Started)
- [ ] **Lock flow UI**
  - Both parties confirm → Swap LOCKED
  - Reveal shipping addresses only after lock
- [ ] **Packing guidelines screen**
  - Checklist with images
  - Remove cap and secure sprayer
  - Bubble wrap minimum 2 layers
  - Rigid box with padding
- [ ] **Photo upload** of packed item before sealing
- [ ] **Tracking number entry**
  - Text field for tracking number
  - Carrier selection (Australia Post, Sendle, CouriersPlease)
- [ ] **Status progression**
  ```
  Packed → Shipped → In Transit → Delivered
  ```
- [ ] **Delivery confirmation** from both parties
- [ ] **48-hour auto-cancel** if tracking not uploaded

---

## Priority 9: Ratings + Trust Metrics

### ✅ Done
- [x] Rating creation (`db.createRating`)
- [x] Rating display on profile
- [x] Average rating calculation

### 🔴 TODO
- [ ] **Post-swap rating prompt** - Trigger after both confirm delivery
- [ ] **Rating form UI** with all categories:
  - Accuracy (was it as described?)
  - Packaging (was it safe?)
  - Communication (were they responsive?)
  - Timeliness (did they ship promptly?)
  - Overall
- [ ] **Written review** (optional)
- [ ] **Verification tier auto-upgrade**
  - 5+ swaps + 4.5+ rating → Trusted
  - 20+ swaps + 4.8+ rating + 6 months → Elite
- [ ] **Positive percentage calculation**
- [ ] **Rating protection** - Can't rate until both confirm receipt

---

## Priority 10: Premium Features

### 🔴 TODO (Not Started)
- [ ] **Premium subscription logic**
  - Check `is_premium` and `premium_until` fields
  - Gate features based on tier
- [ ] **Featured listings** for premium users
  - Sort premium listings first
  - Visual indicator on cards
- [ ] **Batch Hunter alerts** (premium)
  - Notify when specific vintage batch listed
- [ ] **Stripe integration** for subscription payments
- [ ] **Premium settings screen**

---

## Search & Discovery Improvements

### ✅ Done
- [x] Basic search by name/house
- [x] Filter drawer with categories
- [x] Quick filter chips

### 🔴 TODO
- [ ] **AI "Vibe Search"** - Natural language to structured filters
  - "beast mode woody, unisex, clubbing" → filters
  - Requires OpenAI/Claude API integration
- [ ] **Discovery toggle** - "Show only people who want what I have"
  - Cross-reference cabinet with wishlists
- [ ] **Saved filter sets** - Save as "Summer freshies", etc.
- [ ] **Search alerts** - Notify when matching listing appears
- [ ] **Location/state filter** - Filter by Australian state
- [ ] **Apply filters to search** - Currently filters don't actually filter results

---

## Database Migrations Needed

```sql
-- 1. Listing lock status
ALTER TABLE listings ADD COLUMN locked_in_swap_id UUID REFERENCES swaps(id);

-- 2. Listing visibility status
ALTER TABLE listings ADD COLUMN swap_status VARCHAR(20) 
  DEFAULT 'open' CHECK (swap_status IN ('open', 'maybe', 'not_for_swap', 'archived'));

-- 3. Verification photos tracking
ALTER TABLE listings ADD COLUMN verification_photos JSONB DEFAULT '{}';
-- Structure: { front: true, sprayer: false, batch: true, box: false }

-- 4. AI authenticity score
ALTER TABLE listings ADD COLUMN ai_authenticity_score INTEGER;
ALTER TABLE listings ADD COLUMN ai_authenticity_notes TEXT;

-- 5. Shipping tracking
ALTER TABLE swaps ADD COLUMN initiator_packed_photo TEXT;
ALTER TABLE swaps ADD COLUMN recipient_packed_photo TEXT;
ALTER TABLE swaps ADD COLUMN initiator_carrier VARCHAR(50);
ALTER TABLE swaps ADD COLUMN recipient_carrier VARCHAR(50);
```

---

## Environment Variables Needed

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For AI features
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key  # For vibe search
ANTHROPIC_API_KEY=your_claude_key           # For mediator & authenticity

# Future
STRIPE_SECRET_KEY=your_stripe_key           # For premium subscriptions
GREENID_API_KEY=your_greenid_key            # For ID verification
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/profile/edit.tsx` | Edit profile screen |
| `app/profile/address.tsx` | Shipping address management |
| `app/profile/verification.tsx` | ID verification flow |
| `app/listing/edit/[id].tsx` | Edit existing listing |
| `lib/fairness.ts` | Real fairness calculation logic |
| `lib/claude.ts` | Claude API integration for mediator |
| `lib/authenticity.ts` | Photo authenticity AI checks |
| `components/GuidedPhotoCapture.tsx` | Step-by-step photo capture |
| `components/FairnessMeter.tsx` | Real-time fairness display |
| `components/ShippingFlow.tsx` | Packing guidelines + tracking |

---

## Testing Checklist

Before any feature is "done":

- [ ] Works on web
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Real data (no mocks/fakes)
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Empty states handled

---

## Next Immediate Actions

1. **Fix fake fairness scores** - Implement real calculation
2. **Fix fake AI mediator** - Integrate Claude API
3. **Add shipping flow** - Critical for completing swaps
4. **Create profile edit screens** - Missing pages cause crashes
5. **Implement listing soft-lock** - Prevent double-booking

---

*This TODO is the source of truth. Update as features are completed.*

