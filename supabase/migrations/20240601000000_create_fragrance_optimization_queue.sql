-- Create the fragrance_optimization_queue table
CREATE TABLE IF NOT EXISTS public.fragrance_optimization_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fragrance_id UUID NOT NULL REFERENCES public.fragrance_master(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_fragrance_optimization_queue_status ON public.fragrance_optimization_queue(status);
CREATE INDEX IF NOT EXISTS idx_fragrance_optimization_queue_fragrance_id ON public.fragrance_optimization_queue(fragrance_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.fragrance_optimization_queue ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your auth setup)
-- Allow authenticated users to view the queue
CREATE POLICY "Allow authenticated users to view queue" ON public.fragrance_optimization_queue
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert into the queue
CREATE POLICY "Allow authenticated users to insert into queue" ON public.fragrance_optimization_queue
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update the queue
CREATE POLICY "Allow authenticated users to update queue" ON public.fragrance_optimization_queue
    FOR UPDATE TO authenticated USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_fragrance_optimization_queue_updated_at
    BEFORE UPDATE ON public.fragrance_optimization_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
