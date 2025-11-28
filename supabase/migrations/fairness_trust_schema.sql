-- Enhance Listings Table for Provenance & Trust
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS purchase_source TEXT,
ADD COLUMN IF NOT EXISTS purchase_year INTEGER,
ADD COLUMN IF NOT EXISTS bottle_age_years INTEGER GENERATED ALWAYS AS (extract(year from now()) - purchase_year) STORED,
ADD COLUMN IF NOT EXISTS remaining_volume_ml INTEGER,
ADD COLUMN IF NOT EXISTS has_box BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_cap BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS storage_history TEXT, -- e.g., 'cool_dark', 'unknown'
ADD COLUMN IF NOT EXISTS authenticity_declaration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calculated_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS ai_verification_score INTEGER, -- 0-100
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Enhance Swaps Table for Trade Mechanics
ALTER TABLE swaps
ADD COLUMN IF NOT EXISTS value_difference DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS top_up_items JSONB, -- Array of { type: 'sample', name: '...', value: 5.00 }
ADD COLUMN IF NOT EXISTS initiator_accepted_loss BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recipient_accepted_loss BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shipping_status_initiator TEXT DEFAULT 'pending' CHECK (shipping_status_initiator IN ('pending', 'shipped', 'delivered')),
ADD COLUMN IF NOT EXISTS shipping_status_recipient TEXT DEFAULT 'pending' CHECK (shipping_status_recipient IN ('pending', 'shipped', 'delivered'));

-- Create Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
    initiator_id UUID REFERENCES auth.users(id), -- Who raised the dispute
    category TEXT CHECK (category IN ('item_not_as_described', 'authenticity', 'spoilage', 'shipping_damage', 'non_performance')),
    description TEXT,
    evidence_photos TEXT[], -- Array of URLs
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'appealed')),
    resolution TEXT, -- 'refund', 'strike', 'warning'
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- RLS for Disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disputes for their swaps" ON disputes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM swaps 
            WHERE swaps.id = disputes.swap_id 
            AND (swaps.initiator_id = auth.uid() OR swaps.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can create disputes for their swaps" ON disputes
    FOR INSERT
    WITH CHECK (
        auth.uid() = initiator_id AND
        EXISTS (
            SELECT 1 FROM swaps 
            WHERE swaps.id = swap_id 
            AND (swaps.initiator_id = auth.uid() OR swaps.recipient_id = auth.uid())
        )
    );

CREATE POLICY "Admins have full access to disputes" ON disputes
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

