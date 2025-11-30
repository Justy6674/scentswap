-- Create admin RPC functions for dashboard stats

-- Count users (using profiles table as proxy for auth.users to avoid permission issues)
CREATE OR REPLACE FUNCTION public.admin_count_users()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::INTEGER FROM public.users;
$$;

-- Count fragrances
CREATE OR REPLACE FUNCTION public.admin_count_fragrances()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::INTEGER FROM public.fragrance_master;
$$;

-- Count active listings
CREATE OR REPLACE FUNCTION public.admin_count_active_listings()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::INTEGER FROM public.listings WHERE status = 'active';
$$;

-- Get swap stats
CREATE OR REPLACE FUNCTION public.admin_get_swap_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count INTEGER;
  completed_count INTEGER;
BEGIN
  SELECT count(*) INTO active_count FROM public.swaps WHERE status = 'active';
  SELECT count(*) INTO completed_count FROM public.swaps WHERE status = 'completed';
  
  RETURN json_build_object(
    'active', active_count,
    'completed', completed_count
  );
END;
$$;
