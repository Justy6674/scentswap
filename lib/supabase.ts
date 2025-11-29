import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SSR-safe check - only use typeof window check
const isWeb = typeof window !== 'undefined';

// Simple storage adapter for web - no async SecureStore to avoid SSR issues
const createStorageAdapter = () => ({
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  // Don't create client during SSR
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  
  return supabaseInstance;
};

// Legacy export - use getSupabase() instead
export const supabase = null;
