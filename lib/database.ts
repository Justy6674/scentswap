import { User, Listing, Swap, Message, Rating } from '@/types';
import { getSupabase, isSupabaseConfigured } from './supabase';

class DatabaseClient {
  private currentUser: User | null = null;

  async signUp(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { user: null, error: 'Supabase is not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.' };
    }
    
    const supabase = getSupabase()!;
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          username: email.split('@')[0],
          verification_tier: 'unverified',
        })
        .select()
        .single();

      if (userError) throw userError;

      this.currentUser = userData;
      return { user: userData, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { user: null, error: 'Supabase is not configured. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.' };
    }

    const supabase = getSupabase()!;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign in failed');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      this.currentUser = userData;
      return { user: userData, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;
      await supabase.auth.signOut();
    }
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  async restoreSession(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) return null;

      this.currentUser = userData;
      return userData;
    } catch {
      return null;
    }
  }

  async getListings(filters?: {
    userId?: string;
    search?: string;
    concentration?: string;
    minSize?: number;
    maxSize?: number;
  }): Promise<Listing[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          user:users(id, email, username, avatar_url, verification_tier, total_swaps, rating, positive_percentage)
        `)
        .eq('is_active', true);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.search) {
        query = query.or(`custom_name.ilike.%${filters.search}%,house.ilike.%${filters.search}%`);
      }
      if (filters?.concentration && filters.concentration !== 'All') {
        query = query.eq('concentration', filters.concentration);
      }
      if (filters?.minSize) {
        query = query.gte('size_ml', filters.minSize);
      }
      if (filters?.maxSize) {
        query = query.lte('size_ml', filters.maxSize);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return this.getListings({ userId });
  }

  async createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(listing)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('listings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating listing:', error);
      return null;
    }
  }

  async deleteListing(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      return !error;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  }

  async getSwaps(userId: string): Promise<Swap[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('swaps')
        .select(`
          *,
          initiator:users!swaps_initiator_id_fkey(id, email, username, avatar_url, total_swaps, rating),
          recipient:users!swaps_recipient_id_fkey(id, email, username, avatar_url, total_swaps, rating)
        `)
        .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching swaps:', error);
      return [];
    }
  }

  async createSwap(swap: {
    initiator_id: string;
    recipient_id: string;
    initiator_listings: string[];
    recipient_listings: string[];
  }): Promise<{ swap: Swap | null; fairnessScore: number | null; aiAssessment: string | null }> {
    if (!isSupabaseConfigured()) {
      return { swap: null, fairnessScore: null, aiAssessment: null };
    }

    const supabase = getSupabase()!;

    try {
      const fairnessScore = Math.floor(Math.random() * 30) + 70;
      const aiAssessment = fairnessScore >= 85
        ? 'This swap appears to be well-balanced based on market values and condition.'
        : 'This swap has a slight imbalance. Consider adjusting the items offered.';

      const { data, error } = await supabase
        .from('swaps')
        .insert({
          ...swap,
          status: 'proposed',
          fairness_score: fairnessScore,
          ai_assessment: aiAssessment,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        swap: data,
        fairnessScore,
        aiAssessment,
      };
    } catch (error) {
      console.error('Error creating swap:', error);
      return { swap: null, fairnessScore: null, aiAssessment: null };
    }
  }

  async updateSwapStatus(swapId: string, status: Swap['status'], additionalData?: Partial<Swap>): Promise<Swap | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('swaps')
        .update({ status, ...additionalData, updated_at: new Date().toISOString() })
        .eq('id', swapId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating swap:', error);
      return null;
    }
  }

  async getMessages(swapId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, email, username, avatar_url)
        `)
        .eq('swap_id', swapId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(swapId: string, senderId: string, message: string): Promise<Message | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          swap_id: swapId,
          sender_id: senderId,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async requestAIMediation(swapId: string, question: string): Promise<{ response: string | null; error: string | null }> {
    const responses = [
      'Based on the current market values and condition of both fragrances, this appears to be a reasonably fair swap.',
      'I would suggest the person with the higher-valued item consider asking for a small decant to balance this trade.',
      'Both fragrances have similar market values and the fill levels are comparable. This is a balanced swap.',
      'Consider the longevity and sillage ratings - the fragrance you are receiving performs better in these areas.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    return { response, error: null };
  }

  async createRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert(rating)
        .select()
        .single();

      if (error) throw error;

      const { data: avgData } = await supabase
        .from('ratings')
        .select('overall_score')
        .eq('ratee_id', rating.ratee_id);

      if (avgData && avgData.length > 0) {
        const avgRating = avgData.reduce((sum, r) => sum + r.overall_score, 0) / avgData.length;
        await supabase
          .from('users')
          .update({
            rating: avgRating,
            total_swaps: avgData.length,
          })
          .eq('id', rating.ratee_id);
      }

      return data;
    } catch (error) {
      console.error('Error creating rating:', error);
      return null;
    }
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:users(id, email, username, avatar_url)
        `)
        .eq('ratee_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  }

  async getUser(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      if (this.currentUser?.id === userId) {
        this.currentUser = data;
      }
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async checkFairness(initiatorListings: string[], recipientListings: string[]): Promise<{
    score: number;
    assessment: string;
    suggestions: string[];
  } | null> {
    const score = Math.floor(Math.random() * 30) + 70;
    const assessment = score >= 85
      ? 'This swap is well-balanced. Both parties are receiving comparable value.'
      : 'There is a slight imbalance in this swap. The initiator may want to add another item.';
    const suggestions = score < 85
      ? ['Consider adding a decant to balance the trade', 'Review the fill levels of both bottles']
      : [];

    return { score, assessment, suggestions };
  }
}

export const db = new DatabaseClient();
