# Product Requirements Document: AI-Powered Fragrance Upload & Valuation System

**Product:** ScentSwap Australia
**Feature:** AI-Powered Fragrance Upload & Valuation System
**Version:** 1.0
**Date:** November 30, 2025
**Owner:** Product Team
**Status:** Ready for Development Review

---

## Executive Summary

Create an intelligent fragrance upload system that guides users through photographing, identifying, and valuing their fragrances using AI assistance while maintaining user control and legal protection. The system supports both personal collection management and swap marketplace listings with appropriate complexity scaling.

**Scope:** This PRD covers fragrance upload, AI identification, condition assessment, authenticity risk scoring, and valuation. Swap matching, postage logistics, and payment processing are covered in separate Swap Marketplace PRD.

---

## Problem Statement

**Current State:**
- Users manually search and add fragrances with no valuation guidance
- No authenticity risk assessment for marketplace transactions
- Manual condition assessment leads to disputes
- No standardised pricing for fair swaps

**Pain Points:**
- Time-consuming manual fragrance identification
- Uncertainty about fragrance authenticity and value
- Unfair swap negotiations due to information asymmetry
- Risk of counterfeit items in marketplace

---

## Product Goals

### Primary Objectives
1. **Streamline fragrance identification** using AI-assisted photo recognition
2. **Provide fair value estimates** for marketplace confidence
3. **Assess authenticity risk** to reduce counterfeit circulation
4. **Enable fair swap matching** through standardised valuation

### Success Metrics
- **Adoption**: 60% of new fragrances added via AI flow (vs manual search)
- **Accuracy**: 80% user confirmation rate on AI fragrance suggestions
- **Trust**: 4.5+ star rating on authenticity risk feature
- **Engagement**: 40% increase in swap listings from users who complete AI flow

---

## Target Users

### Primary: Fragrance Collectors (Library Users)
- **Goal:** Organise personal collection digitally
- **Pain:** Time-consuming manual entry
- **Need:** Quick, accurate fragrance identification

### Primary: Active Swappers (Marketplace Users)
- **Goal:** List fragrances for trading with fair value
- **Pain:** Uncertain about appropriate swap values
- **Need:** Trusted valuation and authenticity assessment

### Secondary: Casual Browsers
- **Goal:** Explore platform with minimal commitment
- **Pain:** Complex onboarding processes
- **Need:** Simple, optional engagement

---

## Functional Requirements

### 1. Entry Point & Intent Selection

**User Flow:**
```
"Add Fragrance" Button → Intent Selection Screen
```

**Requirements:**
- Present two clear options:
  - "Add to my collection only" (Library path)
  - "Add and list for swap" (Marketplace path)
- Explain difference in complexity/requirements
- Allow path switching during process
- **Scope Limitation**: MVP supports full retail bottles only. No decants, samples, minis, or gift sets.

### 2. AI-Guided Photo Capture

**Library Path (Minimal):**
- Front bottle photo (required)
- Side/angled photo for fill level (optional)

**Marketplace Path (Comprehensive):**
- Front bottle with label (required)
- Side/angled shot for fill level (required)
- Bottom shot for batch code (required)
- Box front and bottom (strongly encouraged)

**Technical Requirements:**
- Camera interface with overlay guides
- Real-time photo quality checking ("Move closer", "Too blurry", "Good shot!")
- Retry capability for poor quality images
- Skip options with risk warnings

### 3. AI Fragrance Recognition Engine

**Input Processing:**
- Analyse front bottle photo for:
  - Brand identification via logo/text recognition
  - Fragrance name via label OCR
  - Concentration type (EDT/EDP/Parfum) detection
  - Size estimation from bottle silhouette

**Output Format:**
- Present top 3 matches with confidence scores:
  ```
  "This looks like:
  1. Dior Sauvage Eau de Parfum 100ml (94% confidence)
  2. Dior Sauvage Eau de Toilette 100ml (87% confidence)
  3. Dior Sauvage Parfum 60ml (76% confidence)"
  ```

**Fallback Options:**
- "None of these - search manually"
- "Add as custom fragrance"

### 4. Manual Confirmation & Details

**Required Confirmations:**
- Fragrance selection from AI suggestions
- Bottle size validation (dropdown: 30/50/75/100/125/200ml)
- Original vs Tester status
- Purchase year (approximate acceptable)

**Marketplace Additional Requirements:**
- Storage conditions (Cool/dark/boxed vs Shelf/light vs Heavy use)
- Visible defects checklist
- Original packaging status

### 5. AI Fill Level Assessment

**AI Processing:**
- Analyse side/angled photo for liquid level
- Estimate fill percentage with confidence range
- Present as: "We estimate around 75% remaining (±5%). Does that look right?"

**User Override:**
- Percentage options: 100/90/80/75/66/50/33/25/10/"Almost empty"
- Store both AI estimate and user selection
- Flag significant discrepancies (>20% difference) for risk assessment

### 6. Authenticity Risk Scoring

**Analysis Inputs:**
- Batch code format validation against known patterns
- Font/logo alignment checking vs reference images
- Packaging consistency (if box photos provided)
- High-risk fragrance database checking

**High-Risk Database:**
- Initial list curated manually via internal admin tool
- Flagged based on: known counterfeit patterns, community reports, dispute volume
- Future automation based on dispute patterns and external data sources

**Risk Categories:**
- ✅ **Likely Authentic**: All checks pass, low-risk fragrance
- ⚠️ **Unclear**: Missing photos or minor inconsistencies
- 🚨 **Higher Risk**: Multiple inconsistencies detected

**Disclaimer Requirements:**
- "AI-assisted estimate only"
- "ScentSwap does not guarantee authenticity"
- "Review photos carefully before agreeing to swaps"

### 7. Value Estimation Engine

**Base Price Calculation:**
- Australian RRP from official sources (Myer, Sephora, Mecca)
- Discount retailer pricing (Chemist Warehouse, Adore Beauty)
- Recent marketplace sales data when available
- Weighted average: 60% discount retail, 40% RRP

**Condition Multiplier Matrix:**
```
Fill Level:
- 95-100% full: 0.85-0.90x baseline
- 70-90% full: 0.60-0.75x baseline
- 50-70% full: 0.45-0.60x baseline
- Below 50%: 0.20-0.45x baseline

Additional Factors:
- No box: -10%
- Tester: -15%
- Visible damage: -5% to -20%
- Poor storage: -10%
```

**Rarity Multiplier:**
- Production status (current/discontinued/limited)
- Platform listing frequency analysis
- Search demand vs availability ratio
- Multiplier range: 0.8x to 2.0x (capped to prevent wild estimates)

**Output Format:**
- Value range, never single number
- "Estimated swap value: $180-220 AUD"
- Rarity classification: Common/Less Common/Rare
- Confidence indicator
- Clear timestamp: "Based on market data as of [date]"

### 8. Data Model Requirements

**Fragrance Master Table:**
```sql
- id, brand, name, concentration, size_options
- baseline_new_price_aud, last_price_update
- rarity_score, production_status
- high_fake_risk_flag (admin updateable)
```

**User Bottle Instance:**
```sql
- id, fragrance_id, owner_user_id
- user_fill_percent, ai_fill_estimate
- condition_flags (json: box, tester, damage, storage)
- purchase_year, authenticity_risk_score
- estimated_value_min, estimated_value_max
- is_library_only, is_listed_for_swap
- photos (front, side, bottom, box_front, box_bottom)
- created_at, last_valuation_update
```

---

## Trust, Safety & Dispute Handling

### User Reputation System
- **Trust Score**: Based on completed swaps, dispute history, community feedback
- **New User Protection**: Extra warnings when trading with unestablished users
- **Reputation Factors**:
  - Successful swap completions (+points)
  - Authenticity disputes (-points)
  - Positive community feedback (+points)
  - Accurate item descriptions (+points)

### High-Risk Item Management
- **Extra Requirements**: High-value items (>$300 AUD) require additional photos
- **Reputation Gates**: Very rare items may be restricted to established users
- **Enhanced Warnings**: Extra disclaimers for known high-counterfeit items

### Dispute Resolution Flow
1. **Initial Report**: User flags authenticity/condition issue post-swap
2. **Evidence Collection**: Both parties provide additional photos/documentation
3. **Automated Assessment**: AI reviews new evidence against original listing
4. **Escalation Criteria**: Complex cases escalated to human review
5. **Resolution Options**: Partial refunds, re-matching, dispute mediation

### Enforcement Actions
- **Warning System**: First-time issues result in educational warnings
- **Temporary Limits**: Repeat issues limit high-value transactions temporarily
- **Account Restrictions**: Serious violations result in marketplace suspension
- **Appeal Process**: Users can contest enforcement actions with additional evidence

---

## User Experience Requirements

### Navigation Flow
1. **Entry Point**: Prominent "Add Fragrance" button in Cabinet tab
2. **Intent Selection**: Clear explanation of library vs marketplace paths
3. **Progress Indicators**: Step counter for marketplace path (Step 1 of 6)
4. **Exit Points**: Save draft capability, return later option

### Photo Capture UX
- **Guided Overlays**: Visual guides showing proper bottle positioning
- **Real-time Feedback**: "Move closer", "Too blurry", "Good shot!"
- **Quality Gates**: Prevent progression with unusable photos
- **Retake Options**: Easy reshoot without losing progress
- **Help Resources**: Example photos showing "good" vs "poor" quality

### AI Interaction Design
- **Confidence Communication**: Visual bars showing AI certainty levels
- **Correction Friendly**: Easy to override AI suggestions with "Not quite right?"
- **Educational**: Explain why certain information is needed ("This helps ensure fair swaps")
- **Progressive Disclosure**: Show basic options first, reveal advanced on request

### Error Handling & Recovery
- **Offline Mode**: Save drafts when internet unavailable
- **Session Recovery**: Resume interrupted uploads after app restart
- **Validation Feedback**: Clear error messages for required fields
- **Fallback Paths**: Manual entry when AI fails

---

## Legal & Risk Requirements

### Authenticity Disclaimers
- Prominent "AI estimate only - not a guarantee" messaging throughout
- No guarantee language anywhere in system
- "Peer-to-peer transaction" framing for marketplace
- Links to authenticity education resources
- Clear liability limitations in terms of service

### Value Estimation Disclaimers
- "Estimated value ranges based on available market data"
- "Actual swap value determined by individual agreement"
- "Market conditions change frequently - values are estimates only"
- Clear timestamp on all valuations ("Estimated on DD/MM/YYYY")

### Data Protection & Privacy
- Photo storage with explicit user consent
- Right to delete uploaded images at any time
- No sharing of personal bottle data without permission
- Compliance with Australian Privacy Principles (APP)
- GDPR compliance for any international expansion

### Content Moderation & Community Guidelines
- User-generated content (photos, descriptions) subject to community guidelines
- Admin tools required for content reporting and takedown
- Automated detection of inappropriate content in photos
- Clear policies on offensive usernames, descriptions, harassment
- Appeal process for content moderation decisions

---

## Technical Requirements

### AI Model Infrastructure
- **Fragrance Recognition CNN**: Target 85% accuracy on top-3 suggestions
- **OCR Engine**: Text extraction for batch codes and labels (95% character accuracy)
- **Fill Level Detection**: ±15% accuracy on liquid level estimation
- **Image Quality Assessment**: Real-time blur/lighting/angle detection

### Performance Requirements
- **Photo Processing**: Target <3 seconds for AI analysis on 4G; hard cap 10 seconds with progress feedback
- **App Responsiveness**: No UI blocking during AI processing (background with spinners)
- **Offline Capability**: Save drafts without internet connection, sync when online
- **Cross-platform**: Feature parity across iOS/Android/Web with platform-optimised UX

### Integration Points
- **Pricing APIs**: Real-time Australian retailer data feeds (daily updates minimum)
- **Database**: Seamless integration with existing fragrance master database
- **Authentication**: Integration with existing user authentication system
- **Notifications**: Push notifications for upload completion, valuation updates
- **Analytics**: Integration with existing analytics platform for user behaviour tracking

### Scalability Considerations
- **Image Storage**: Efficient compression and CDN delivery for photos
- **AI Processing**: Queue-based system to handle peak load periods
- **Database Performance**: Indexed queries for fragrance matching and valuation lookups
- **Caching Strategy**: Cache AI results and pricing data appropriately

---

## Analytics & Monitoring

### User Behaviour Tracking
- Flow completion rates by path (library vs marketplace)
- AI suggestion acceptance rates by fragrance category
- Photo retake frequency and common quality issues
- Manual override frequency and reasons
- Time-to-completion for each flow path

### AI Performance Monitoring
- Fragrance recognition accuracy by brand/category/price tier
- Fill level estimation accuracy vs user corrections
- Authenticity risk score correlation with actual dispute rates
- Value estimation accuracy vs actual completed swap values
- False positive/negative rates for each AI component

### Business Metrics
- Conversion from AI flow to active marketplace listing
- Swap completion rates for AI-valued vs manually-valued bottles
- User satisfaction scores for valuation accuracy (quarterly surveys)
- Support ticket volume related to authenticity/valuation disputes
- Revenue impact from improved marketplace trust and activity

### Quality Assurance Metrics
- Photo quality distribution and rejection rates
- AI confidence score distribution and calibration
- User correction patterns for continuous AI improvement
- Valuation accuracy tracking via post-swap feedback

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**MVP Delivery Target**
- Basic photo capture interface with guided overlays
- Simple fragrance recognition (top 1 suggestion, manual fallback)
- Manual confirmation flow for all details
- Library-only path fully functional
- Basic legal disclaimers integrated

### Phase 2: Enhanced AI (Weeks 5-8)
- Multi-photo guided capture with quality checking
- Top-3 AI suggestions with confidence indicators
- Fill level estimation with user override
- Basic value calculation for common designer fragrances
- Authenticity risk scoring (basic pattern matching)

### Phase 3: Marketplace Integration (Weeks 9-12)
- Full marketplace listing path with enhanced requirements
- Advanced authenticity risk assessment with photo analysis
- Complete value engine with rarity calculations
- User reputation system foundation
- Integration with existing swap matching system

### Phase 4: Trust & Optimisation (Weeks 13-16)
- Dispute resolution workflow implementation
- AI model refinement based on real user data
- Advanced analytics dashboard for business monitoring
- Performance optimisation for scale
- Enhanced content moderation tools

---

## Definition of Done

### Minimum Viable Product (MVP) - End of Phase 2
- [ ] Users can photograph bottles and receive AI fragrance suggestions with 80% accuracy
- [ ] Fill level estimation works within ±20% accuracy for clear photos
- [ ] Value ranges generated for 500+ most common fragrances in database
- [ ] Library path supports full user journey from photo to saved bottle
- [ ] Legal disclaimers properly integrated throughout experience
- [ ] Basic authenticity risk assessment functional

### Full Feature Complete - End of Phase 3
- [ ] Marketplace path fully functional with enhanced photo requirements
- [ ] Authenticity risk scoring live with visual confidence indicators
- [ ] Value engine covers 95% of fragrances in master database
- [ ] Integration complete with existing user and swap systems
- [ ] User reputation system tracking successful swaps and disputes
- [ ] Admin tools available for high-risk item management

### Success Criteria - Post-Launch (Phase 4+)
- [ ] 60% of new bottles added via AI flow vs manual search
- [ ] Average user rating of 4.2+ for AI assistance helpfulness
- [ ] <3% user complaints about valuation accuracy
- [ ] Zero legal issues related to authenticity/valuation claims
- [ ] System handles 1000+ fragrance additions per day without performance degradation

---

## Risks & Mitigation Strategies

### Technical Risks
- **AI Model Accuracy**: Mitigation via extensive training data collection and user feedback loops
- **Performance at Scale**: Mitigation via queue-based processing and efficient image compression
- **Integration Complexity**: Mitigation via phased rollout and thorough API testing

### Business Risks
- **User Adoption**: Mitigation via simple library path and clear value propositions
- **Legal Liability**: Mitigation via comprehensive disclaimers and terms of service updates
- **Market Data Accuracy**: Mitigation via multiple data sources and regular validation

### Operational Risks
- **Content Moderation Load**: Mitigation via automated detection and clear escalation processes
- **Customer Support Volume**: Mitigation via comprehensive help documentation and self-service tools
- **Fraud and Disputes**: Mitigation via reputation systems and graduated enforcement

---

## Open Questions & Decisions Needed

1. **AI Training Data**: Strategy for sourcing Australian-specific bottle images for training dataset
2. **Pricing Data Access**: Negotiations with Australian retailers for API access vs web scraping approach
3. **International Expansion**: How will pricing and valuation adapt to region-specific data sources and currencies when expanding beyond Australia?
4. **Content Moderation**: Internal team vs third-party moderation service for inappropriate content detection
5. **Advanced Features**: Timeline for supporting decants, samples, vintage bottles, and gift sets post-MVP
6. **Revenue Model**: Platform fees for marketplace transactions vs subscription model impact on feature access

---

## Out of Scope for This PRD

**Explicitly not included in this feature:**
- Swap matching algorithm and user interface
- Payment processing and escrow services
- Shipping and logistics coordination
- Advanced inventory management features
- Social features (wishlists, following other collectors)
- Professional appraisal services or insurance valuations

**Future PRDs will cover:**
- Swap Marketplace Experience & Matching
- Payment & Shipping Coordination
- Advanced Community Features
- Professional Services Integration

---

**Approval Required From:**
- [ ] Product Owner (Business Requirements)
- [ ] Legal Team (Risk Assessment & Disclaimers)
- [ ] Engineering Lead (Technical Feasibility)
- [ ] Design Lead (UX Requirements)
- [ ] Data Science Lead (AI Model Strategy)

**Next Steps:**
1. Stakeholder review and sign-off on PRD
2. Technical architecture design document
3. AI model development and training strategy
4. Legal review of updated terms of service
5. UI/UX design mockups for critical user flows
6. Project timeline and resource allocation planning

---

*Document Version Control: v1.0 - Initial comprehensive PRD ready for development review*