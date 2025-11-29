import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SSR-safe check for web platform
const isWeb = typeof window !== 'undefined' || Platform.OS === 'web';

// Lazy-loaded SecureStore to avoid SSR issues
let SecureStore: typeof import('expo-secure-store') | null = null;
const getSecureStore = async () => {
  if (!SecureStore && !isWeb) {
    SecureStore = await import('expo-secure-store');
  }
  return SecureStore;
};

// Storage adapter that works on both web and native
const createStorageAdapter = () => ({
  getItem: async (key: string): Promise<string | null> => {
    // Web: use localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    // Native: use SecureStore
    const store = await getSecureStore();
    if (store) {
      return store.getItemAsync(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // Web: use localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    // Native: use SecureStore
    const store = await getSecureStore();
    if (store) {
      await store.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    // Web: use localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    // Native: use SecureStore
    const store = await getSecureStore();
    if (store) {
      await store.deleteItemAsync(key);
    }
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
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

// Lazy initialization - don't create client at module load time during SSR
export const supabase = isSupabaseConfigured() && typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

  : null;
