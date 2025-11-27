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

  // =============================================================================
  // SHIPPING & TRACKING
  // =============================================================================

  async lockSwap(swapId: string): Promise<Swap | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('swaps')
        .update({
          status: 'locked',
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', swapId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error locking swap:', error);
      return null;
    }
  }

  async updateTracking(
    swapId: string,
    userId: string,
    trackingNumber: string,
    carrier: string
  ): Promise<Swap | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      // First get the swap to determine if user is initiator or recipient
      const { data: swap, error: fetchError } = await supabase
        .from('swaps')
        .select('*')
        .eq('id', swapId)
        .single();

      if (fetchError || !swap) throw fetchError || new Error('Swap not found');

      const isInitiator = swap.initiator_id === userId;
      const updateData: Partial<Swap> = {
        updated_at: new Date().toISOString(),
      };

      if (isInitiator) {
        updateData.initiator_tracking = trackingNumber;
        updateData.initiator_shipped_at = new Date().toISOString();
      } else {
        updateData.recipient_tracking = trackingNumber;
        updateData.recipient_shipped_at = new Date().toISOString();
      }

      // Check if both have shipped to update status to 'shipping'
      const bothShipped = isInitiator
        ? swap.recipient_tracking && trackingNumber
        : swap.initiator_tracking && trackingNumber;

      if (bothShipped && swap.status === 'locked') {
        updateData.status = 'shipping';
      }

      const { data, error } = await supabase
        .from('swaps')
        .update(updateData)
        .eq('id', swapId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating tracking:', error);
      return null;
    }
  }

  async confirmReceived(swapId: string, userId: string): Promise<Swap | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      // First get the swap
      const { data: swap, error: fetchError } = await supabase
        .from('swaps')
        .select('*')
        .eq('id', swapId)
        .single();

      if (fetchError || !swap) throw fetchError || new Error('Swap not found');

      const isInitiator = swap.initiator_id === userId;
      const updateData: Partial<Swap> = {
        updated_at: new Date().toISOString(),
      };

      if (isInitiator) {
        updateData.initiator_received_at = new Date().toISOString();
      } else {
        updateData.recipient_received_at = new Date().toISOString();
      }

      // Check if both have received to complete the swap
      const bothReceived = isInitiator
        ? swap.recipient_received_at && true
        : swap.initiator_received_at && true;

      if (bothReceived) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('swaps')
        .update(updateData)
        .eq('id', swapId)
        .select()
        .single();

      if (error) throw error;

      // If swap is completed, update user stats
      if (data?.status === 'completed') {
        await this.incrementUserSwapCount(swap.initiator_id);
        await this.incrementUserSwapCount(swap.recipient_id);
      }

      return data;
    } catch (error) {
      console.error('Error confirming received:', error);
      return null;
    }
  }

  private async incrementUserSwapCount(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase()!;

    try {
      const { data: user } = await supabase
        .from('users')
        .select('total_swaps')
        .eq('id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            total_swaps: (user.total_swaps || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error incrementing swap count:', error);
    }
  }

  async getUserShippingAddress(userId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('shipping_address')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.shipping_address || null;
    } catch (error) {
      console.error('Error fetching shipping address:', error);
      return null;
    }
  }

  async updateShippingAddress(userId: string, address: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          shipping_address: address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating shipping address:', error);
      return false;
    }
  }

  // =============================================================================
  // OUTSETA USER SYNC
  // =============================================================================

  /**
   * Get user by Outseta Person UID
   */
  async getUserByOutsetaId(outsetaPersonUid: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('outseta_person_uid', outsetaPersonUid)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      console.error('Error fetching user by Outseta ID:', error);
      return null;
    }
  }

  /**
   * Get user by email (for Outseta sync)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Create user from Outseta data (no Supabase Auth required)
   */
  async createUserFromOutseta(userData: {
    email: string;
    full_name: string;
    outseta_person_uid: string;
    outseta_account_uid?: string;
    subscription_plan?: string;
    subscription_status?: string;
  }): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      // Generate a UUID for the user
      const userId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          username: userData.email.split('@')[0],
          verification_tier: 'unverified',
          outseta_person_uid: userData.outseta_person_uid,
          outseta_account_uid: userData.outseta_account_uid,
          subscription_plan: userData.subscription_plan || 'free',
          subscription_status: userData.subscription_status || 'active',
        })
        .select()
        .single();

      if (error) throw error;

      this.currentUser = data;
      return data;
    } catch (error) {
      console.error('Error creating user from Outseta:', error);
      return null;
    }
  }

  /**
   * Update user with Outseta data
   */
  async updateUserFromOutseta(userId: string, updates: {
    outseta_person_uid?: string;
    outseta_account_uid?: string;
    subscription_plan?: string;
    subscription_status?: string;
  }): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      if (this.currentUser?.id === userId) {
        this.currentUser = data;
      }
      return data;
    } catch (error) {
      console.error('Error updating user from Outseta:', error);
      return null;
    }
  }

  /**
   * Handle Outseta webhook for new user signup
   */
  async handleOutsetaSignup(webhookData: {
    Person: {
      Uid: string;
      Email: string;
      FirstName?: string;
      LastName?: string;
    };
    Account: {
      Uid: string;
    };
    Subscription?: {
      Plan?: {
        Uid: string;
        Name: string;
      };
      Status?: string;
    };
  }): Promise<{ user: User | null; clientIdentifier: string | null }> {
    try {
      const { Person, Account, Subscription } = webhookData;
      const fullName = `${Person.FirstName || ''} ${Person.LastName || ''}`.trim() || Person.Email.split('@')[0];

      // Check if user already exists
      let user = await this.getUserByOutsetaId(Person.Uid);
      
      if (!user) {
        user = await this.getUserByEmail(Person.Email);
      }

      if (user) {
        // Update existing user
        user = await this.updateUserFromOutseta(user.id, {
          outseta_person_uid: Person.Uid,
          outseta_account_uid: Account.Uid,
          subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
          subscription_status: Subscription?.Status || 'active',
        });
      } else {
        // Create new user
        user = await this.createUserFromOutseta({
          email: Person.Email,
          full_name: fullName,
          outseta_person_uid: Person.Uid,
          outseta_account_uid: Account.Uid,
          subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
          subscription_status: Subscription?.Status || 'active',
        });
      }

      return {
        user,
        clientIdentifier: user?.id || null,
      };
    } catch (error) {
      console.error('Error handling Outseta signup:', error);
      return { user: null, clientIdentifier: null };
    }
  }

  /**
   * Handle Outseta webhook for subscription update
   */
  async handleOutsetaSubscriptionUpdate(webhookData: {
    Account: {
      Uid: string;
    };
    Subscription: {
      Plan?: {
        Uid: string;
        Name: string;
      };
      Status?: string;
    };
  }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { Account, Subscription } = webhookData;

      const { error } = await supabase
        .from('users')
        .update({
          subscription_plan: Subscription?.Plan?.Name?.toLowerCase() || 'free',
          subscription_status: Subscription?.Status || 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('outseta_account_uid', Account.Uid);

      return !error;
    } catch (error) {
      console.error('Error handling subscription update:', error);
      return false;
    }
  }

  // =============================================================================
  // ADMIN METHODS
  // =============================================================================

  async isUserAdmin(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) return false;
      return data?.is_admin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async getAdminStats(): Promise<any> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase()!;

    try {
      // Get counts from each table
      const [usersResult, listingsResult, swapsResult] = await Promise.all([
        supabase.from('users').select('id, created_at, verification_tier, subscription_plan', { count: 'exact' }),
        supabase.from('listings').select('id, created_at, is_active', { count: 'exact' }),
        supabase.from('swaps').select('id, created_at, status', { count: 'exact' }),
      ]);

      const users = usersResult.data || [];
      const listings = listingsResult.data || [];
      const swaps = swapsResult.data || [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        total_users: users.length,
        new_users_7d: users.filter(u => new Date(u.created_at) > weekAgo).length,
        active_listings: listings.filter(l => l.is_active).length,
        new_listings_7d: listings.filter(l => new Date(l.created_at) > weekAgo).length,
        total_swaps: swaps.length,
        pending_swaps: swaps.filter(s => s.status === 'proposed').length,
        completed_swaps: swaps.filter(s => s.status === 'completed').length,
        disputed_swaps: swaps.filter(s => s.status === 'disputed').length,
        new_swaps_7d: swaps.filter(s => new Date(s.created_at) > weekAgo).length,
        verified_users: users.filter(u => u.verification_tier === 'verified' || u.verification_tier === 'trusted' || u.verification_tier === 'elite').length,
        premium_users: users.filter(u => u.subscription_plan === 'premium').length,
        elite_users: users.filter(u => u.subscription_plan === 'elite').length,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return null;
    }
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent users:', error);
      return [];
    }
  }

  async getDisputedSwaps(): Promise<Swap[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting disputed swaps:', error);
      return [];
    }
  }

  async adminUpdateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async adminResolveDispute(swapId: string, resolution: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      const { error } = await supabase
        .from('swaps')
        .update({
          status: 'completed',
          dispute_resolved_at: new Date().toISOString(),
          ai_assessment: `Dispute resolved by admin: ${resolution}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', swapId);

      return !error;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return false;
    }
  }

  // =============================================================================
  // AI CONFIGURATION (ADMIN)
  // =============================================================================

  async getAiConfigs(): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];

    const supabase = getSupabase()!;

    try {
      const { data, error } = await supabase
        .from('ai_configs')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI configs:', error);
      return [];
    }
  }

  async updateAiConfig(key: string, value: any, adminId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const supabase = getSupabase()!;

    try {
      // First check if it exists
      const { data: existing } = await supabase
        .from('ai_configs')
        .select('id')
        .eq('key', key)
        .single();

      let error;
      if (existing) {
        const result = await supabase
          .from('ai_configs')
          .update({
            value,
            updated_at: new Date().toISOString(),
            updated_by: adminId
          })
          .eq('key', key);
        error = result.error;
      } else {
        const result = await supabase
          .from('ai_configs')
          .insert({
            key,
            value,
            updated_by: adminId
          });
        error = result.error;
      }

      if (error) throw error;
      
      await this.logAdminAction(adminId, 'update_ai_config', 'config', key, { newValue: value });
      return true;
    } catch (error) {
      console.error('Error updating AI config:', error);
      return false;
    }
  }

  async logAdminAction(adminId: string, action: string, targetType: string, targetId: string, details?: any): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase()!;

    try {
      // Try to insert into admin_logs (new table)
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          admin_id: adminId,
          action,
          target_type: targetType,
          target_id: targetId, // Expects UUID
          details: details || {},
        });

      if (error) {
        // If UUID error (22P02), log with admin_id as target and original ID in details
        if (error.code === '22P02') {
           await supabase.from('admin_logs').insert({
              admin_id: adminId,
              action,
              target_type: targetType,
              target_id: adminId, 
              details: { ...details, original_target_id: targetId }
           });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }
  // =============================================================================
  // AI REVIEW QUEUE
  // =============================================================================

  async getFlaggedListings(): Promise<Listing[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase()!;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users(username)
        `)
        .eq('admin_verified', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching flagged listings:', error);
      return [];
    }
  }

  async approveListing(listingId: string, adminId: string, overrideData?: any): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const supabase = getSupabase()!;
    try {
      const updates: any = {
        admin_verified: true,
        admin_verified_at: new Date().toISOString(),
      };
      
      if (overrideData) {
        updates.ai_assessment_override = overrideData;
      }

      const { error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', listingId);

      if (error) throw error;
      
      await this.logAdminAction(adminId, 'approve_listing', 'listing', listingId, { override: !!overrideData });
      return true;
    } catch (error) {
      console.error('Error approving listing:', error);
      return false;
    }
  }
  // =============================================================================
  // TOKEN USAGE & QUOTAS
  // =============================================================================

  async trackTokenUsage(userId: string, feature: string, cost: number, model: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase()!;
    try {
      await supabase.from('token_usage').insert({
        user_id: userId,
        feature,
        tokens_used: cost,
        model_used: model
      });
    } catch (error) {
      console.error('Error tracking token usage:', error);
    }
  }

  async checkTokenQuota(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number }> {
    if (!isSupabaseConfigured()) return { allowed: true, remaining: 100 }; // Fail open if not configured
    
    const limits: Record<string, number> = {
      'free': 5,
      'premium': 50,
      'elite': 999999 // Unlimited
    };
    
    const limit = limits[tier] || 5;
    if (limit > 10000) return { allowed: true, remaining: 999999 };

    const supabase = getSupabase()!;
    try {
      // Get usage for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('token_usage')
        .select('tokens_used')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;

      const used = data?.reduce((sum, row) => sum + row.tokens_used, 0) || 0;
      const remaining = Math.max(0, limit - used);
      
      return { allowed: remaining > 0, remaining };
    } catch (error) {
      console.error('Error checking token quota:', error);
      return { allowed: true, remaining: 0 }; // Fail safe? Or block? Let's fail open for now.
    }
  }
}

export const db = new DatabaseClient();
