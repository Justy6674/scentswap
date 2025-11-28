# Product Requirements Document: Fair Value, Trust & Trade Mechanics

## 1. Introduction

This PRD defines the core logic for ScentSwap's "Fair Value & Trust Engine," a system designed to facilitate equitable, cashless fragrance trades through algorithmic valuation, AI verification, and robust trust mechanics.

## 2. Core Valuation Logic ("The Fairness Engine")

### Baseline Pricing Strategy
*   **Primary Source:** "Street Price" (Average discounted retail price from major AU retailers: Chemist Warehouse, Myer, David Jones).
*   **Fallback:** RRP if no discount available.
*   **International:** USD/EUR converted to AUD + 20% import buffer for items not sold in AU.

### Value Calculation Formula
The trade value is dynamically calculated to reflect real-world secondary market expectations.

$$
\text{Trade Value} = (\text{Baseline Price}) \times (\% \text{ Remaining}) \times (\text{Used Factor}) \times (\text{Rarity Multiplier}) - \text{Penalties}
$$

*   **Used Factor:** 0.90 (Standard 10% deduction for opened items).
*   **Rarity Multipliers:**
    *   Readily Available: 1.0x
    *   Discontinued (<2 yrs): 1.1x
    *   Discontinued (2-5 yrs): 1.25x
    *   Vintage/Rare (5+ yrs): 1.4x (capped at 2x without admin override).
*   **Condition Penalties:**
    *   No Box: -5%
    *   No Cap: -5%
    *   Damaged/Unknown Storage: -5% to -15%

## 3. Trade Mechanics (Cashless System)

### Balancing Unequal Trades
Since no money changes hands, value gaps must be bridged with inventory.

1.  **Variance Thresholds:**
    *   **<$5:** Considered balanced.
    *   **$5 - $20:** Suggest top-up, allow "Accept Loss".
    *   **>$20:** Require top-up or explicit "Accept Significant Loss" confirmation.

2.  **Resolution Options:**
    *   **Option A (Top-Up):** User with lower value adds samples, decants, or lesser bottles.
    *   **Option B (Accept Loss):** Explicit checkbox: *"I accept receiving $X less value."*
    *   **Option C (Counter):** Modify proposal.

### Trade Flow
1.  **Initiate:** Select item(s) from own library to offer against a target item.
2.  **Compare:** System displays side-by-side value comparison bar.
3.  **Negotiate:** In-app chat opens for Q&A/photos.
4.  **Accept:** Dual-acceptance required to lock the trade.

## 4. Shipping & Logistics (Australia Specific)

### Regulatory Compliance
*   **Classification:** Class 3 Dangerous Goods (Flammable Liquid).
*   **Carrier:** **Australia Post Parcel Post (Road Only)**. Air express is prohibited.
*   **Cost:** Each party pays their own shipping.

### Tracking & Escrow
*   **Mandatory Tracking:** For trades with combined value >$30.
*   **Shipping Window:** 48 hours to ship and enter tracking number.
*   **State Flow:**
    *   `Accepted` -> `Locked`
    *   `Shipped` (Both tracking #s entered)
    *   `Delivered` (Tracking API confirmation)
    *   `Completed` (After 48hr inspection window)

## 5. User Trust & Verification

### Listing Intake Form
To build confidence, listings must include detailed provenance.
*   **Purchase Source:** e.g., "Myer", "Duty Free", "Grey Market".
*   **Bottle Age:** Year purchased.
*   **Storage History:** "Cool/Dark" declaration.
*   **Authenticity Declaration:** Mandatory checkbox.

### AI Verification Checks
*   **OCR Verification:** Validates handwritten note with Username + Date in photo.
*   **Visual ID:** Matches bottle shape/logo to brand reference.
*   **Batch Code:** Validates format against brand patterns.

### Reputation System
*   **Tiers:** Unverified -> Address Verified -> Trusted Trader (5+ trades) -> Verified Collector.
*   **Ratings:** 1-5 stars on Accuracy, Communication, Shipping.
*   **Strike System:**
    *   Non-shipment: 1 strike
    *   Misrepresentation: 1-2 strikes
    *   Counterfeit: Immediate Ban
    *   3 Strikes = Suspension.

## 6. Dispute Resolution

### Categories
1.  **Item Not As Described:** Wrong fill level, damage, missing extras.
2.  **Authenticity:** Fake/Counterfeit suspicion.
3.  **Spoilage:** Scent "turned" (sour/off).
4.  **Shipping:** Damaged/Lost in transit.
5.  **Non-Performance:** Failure to ship.

### Resolution Process
1.  **Direct Resolution:** 24hr chat window for users to resolve amicably.
2.  **Formal Dispute:** Submit evidence (photos/video).
3.  **Admin Review:**
    *   *Return/Reverse:* Both items returned (at fault party pays).
    *   *Strike:* Applied to offending user.
    *   *Ban:* For fraud/fakes.

---
*This PRD integrates the core "Fair Value" logic with the practical "Trade Mechanics" required for a cashless, trust-based marketplace.*
