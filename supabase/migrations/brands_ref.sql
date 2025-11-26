-- Create brands_ref table
CREATE TABLE IF NOT EXISTS public.brands_ref (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL,
    avg_price_per_ml_aud NUMERIC(10, 2),
    hype_multiplier NUMERIC(3, 2),
    batch_importance TEXT,
    popular_lines TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.brands_ref ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (public)
CREATE POLICY "Enable read access for all users" ON public.brands_ref
    FOR SELECT USING (true);

-- Seed data
INSERT INTO public.brands_ref (brand_name, tier, avg_price_per_ml_aud, hype_multiplier, batch_importance, popular_lines)
VALUES
  ('Creed', 'Niche', 4.50, 1.2, 'CRITICAL', ARRAY['Aventus', 'Green Irish Tweed', 'Silver Mountain Water']),
  ('Parfums de Marly', 'Niche', 3.20, 1.15, 'MODERATE', ARRAY['Layton', 'Herod', 'Althair', 'Haltane']),
  ('Tom Ford', 'Luxury Designer', 3.80, 1.1, 'HIGH', ARRAY['Tobacco Vanille', 'Oud Wood', 'Fabulous', 'Ombre Leather']),
  ('Maison Francis Kurkdjian (MFK)', 'Niche', 4.20, 1.3, 'LOW', ARRAY['Baccarat Rouge 540', 'Grand Soir', 'Gentle Fluidity']),
  ('Dior', 'Designer', 1.80, 1.0, 'HIGH', ARRAY['Sauvage', 'Dior Homme Intense', 'Fahrenheit']),
  ('Xerjoff', 'Niche', 3.50, 1.1, 'LOW', ARRAY['Naxos', 'Alexandria II', 'Torino21']),
  ('Roja Parfums', 'Ultra Niche', 7.50, 1.0, 'MODERATE', ARRAY['Elysium', 'Enigma', 'Sweetie Aoud']),
  ('Chanel', 'Designer', 2.10, 1.05, 'LOW', ARRAY['Bleu de Chanel', 'Allure Homme Sport', 'Coco Mademoiselle']),
  ('Amouage', 'Niche', 3.40, 0.95, 'HIGH', ARRAY['Interlude Man', 'Reflection Man', 'Jubilation XXV']),
  ('Nishane', 'Niche', 3.00, 1.1, 'LOW', ARRAY['Hacivat', 'Ani', 'Wulong Cha']),
  ('Jean Paul Gaultier', 'Designer', 1.40, 1.2, 'LOW', ARRAY['Le Male Le Parfum', 'Ultra Male', 'Elixir']),
  ('Initio Parfums Privés', 'Niche', 3.60, 1.15, 'LOW', ARRAY['Oud for Greatness', 'Side Effect', 'Rehab']),
  ('Louis Vuitton', 'Luxury Designer', 4.80, 1.25, 'LOW', ARRAY['Ombre Nomade', 'Imagination', 'Afternoon Swim']),
  ('Armani', 'Designer', 1.60, 1.0, 'MODERATE', ARRAY['Acqua Di Gio', 'Stronger With You', 'Code']),
  ('By Kilian', 'Niche', 4.50, 1.1, 'LOW', ARRAY['Angels Share', 'Black Phantom', 'Intoxicated']),
  ('Mancera', 'Entry Niche', 1.50, 0.9, 'LOW', ARRAY['Cedrat Boise', 'Red Tobacco', 'Instant Crush']),
  ('Montale', 'Entry Niche', 1.40, 0.85, 'LOW', ARRAY['Intense Cafe', 'Arabians Tonka', 'Chocolate Greedy']),
  ('Le Labo', 'Niche', 4.00, 1.1, 'LOW', ARRAY['Santal 33', 'Another 13', 'Bergamote 22']),
  ('Yves Saint Laurent', 'Designer', 1.70, 1.1, 'LOW', ARRAY['Y EDP', 'La Nuit de L''Homme', 'Myslf']),
  ('Frederic Malle', 'Niche', 3.90, 1.05, 'MODERATE', ARRAY['Portrait of a Lady', 'Musc Ravageur', 'Carnal Flower'])
ON CONFLICT (brand_name) DO UPDATE SET
    tier = EXCLUDED.tier,
    avg_price_per_ml_aud = EXCLUDED.avg_price_per_ml_aud,
    hype_multiplier = EXCLUDED.hype_multiplier,
    batch_importance = EXCLUDED.batch_importance,
    popular_lines = EXCLUDED.popular_lines;
