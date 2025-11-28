-- Create Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    country TEXT,
    website TEXT,
    tier TEXT CHECK (tier IN ('designer', 'niche', 'luxury', 'indie', 'celebrity', 'clone', 'budget')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Perfumers Table
CREATE TABLE IF NOT EXISTS perfumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Fragrance Families Table
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., "Floral", "Woody"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    family_id UUID REFERENCES families(id),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Core Fragrances Table
CREATE TABLE IF NOT EXISTS fragrances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
    concentration TEXT CHECK (concentration IN ('edc', 'edt', 'edp', 'parfum', 'extrait', 'unknown')),
    launch_year INTEGER,
    description TEXT,
    image_url TEXT,
    is_discontinued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for search
    CONSTRAINT unique_brand_fragrance UNIQUE(brand_id, name, concentration)
);

-- Create Fragrance Notes Join Table (The Pyramid)
CREATE TABLE IF NOT EXISTS fragrance_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('top', 'middle', 'base', 'linear')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Fragrance Perfumers Join Table
CREATE TABLE IF NOT EXISTS fragrance_perfumers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
    perfumer_id UUID REFERENCES perfumers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Fragrance Accords Join Table
CREATE TABLE IF NOT EXISTS fragrance_accords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
    accord_name TEXT NOT NULL, -- e.g., "citrus", "woody"
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_perfumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_accords ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can do everything, Public can read
CREATE POLICY "Public Read Brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admins Write Brands" ON brands FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Perfumers" ON perfumers FOR SELECT USING (true);
CREATE POLICY "Admins Write Perfumers" ON perfumers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Families" ON families FOR SELECT USING (true);
CREATE POLICY "Admins Write Families" ON families FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Admins Write Notes" ON notes FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Fragrances" ON fragrances FOR SELECT USING (true);
CREATE POLICY "Admins Write Fragrances" ON fragrances FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Fragrance Notes" ON fragrance_notes FOR SELECT USING (true);
CREATE POLICY "Admins Write Fragrance Notes" ON fragrance_notes FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Fragrance Perfumers" ON fragrance_perfumers FOR SELECT USING (true);
CREATE POLICY "Admins Write Fragrance Perfumers" ON fragrance_perfumers FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

CREATE POLICY "Public Read Fragrance Accords" ON fragrance_accords FOR SELECT USING (true);
CREATE POLICY "Admins Write Fragrance Accords" ON fragrance_accords FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id::uuid = auth.uid() AND is_admin = true));

