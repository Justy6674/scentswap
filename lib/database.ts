import { User, Listing, Swap, Message, Rating, Fragrance, Wishlist, SwapPreferences } from '@/types';
import { Platform } from 'react-native';

const getApiBase = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};

const API_BASE = getApiBase();

class DatabaseClient {
  private currentUser: User | null = null;

  async signUp(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign up failed');
      this.currentUser = data.user;
      return { user: data.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed');
      this.currentUser = data.user;
      return { user: data.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  async getListings(filters?: {
    userId?: string;
    search?: string;
    concentration?: string;
    minSize?: number;
    maxSize?: number;
  }): Promise<Listing[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.concentration) params.append('concentration', filters.concentration);
      if (filters?.minSize) params.append('minSize', filters.minSize.toString());
      if (filters?.maxSize) params.append('maxSize', filters.maxSize.toString());

      const response = await fetch(`${API_BASE}/api/listings?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch listings');
      return data.listings || [];
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return this.getListings({ userId });
  }

  async createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing | null> {
    try {
      const response = await fetch(`${API_BASE}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create listing');
      return data.listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
    try {
      const response = await fetch(`${API_BASE}/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update listing');
      return data.listing;
    } catch (error) {
      console.error('Error updating listing:', error);
      return null;
    }
  }

  async deleteListing(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/listings/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  }

  async getSwaps(userId: string): Promise<Swap[]> {
    try {
      const response = await fetch(`${API_BASE}/api/swaps?userId=${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch swaps');
      return data.swaps || [];
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
    try {
      const response = await fetch(`${API_BASE}/api/swaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swap),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create swap');
      return {
        swap: data.swap,
        fairnessScore: data.fairness_score,
        aiAssessment: data.ai_assessment,
      };
    } catch (error) {
      console.error('Error creating swap:', error);
      return { swap: null, fairnessScore: null, aiAssessment: null };
    }
  }

  async updateSwapStatus(swapId: string, status: Swap['status'], additionalData?: Partial<Swap>): Promise<Swap | null> {
    try {
      const response = await fetch(`${API_BASE}/api/swaps/${swapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update swap');
      return data.swap;
    } catch (error) {
      console.error('Error updating swap:', error);
      return null;
    }
  }

  async getMessages(swapId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE}/api/swaps/${swapId}/messages`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch messages');
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(swapId: string, senderId: string, message: string): Promise<Message | null> {
    try {
      const response = await fetch(`${API_BASE}/api/swaps/${swapId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: senderId, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send message');
      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async requestAIMediation(swapId: string, question: string): Promise<{ response: string | null; error: string | null }> {
    try {
      const response = await fetch(`${API_BASE}/api/swaps/${swapId}/ai-mediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI mediation failed');
      return { response: data.response, error: null };
    } catch (error: any) {
      return { response: null, error: error.message };
    }
  }

  async createRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating | null> {
    try {
      const response = await fetch(`${API_BASE}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create rating');
      return data.rating;
    } catch (error) {
      console.error('Error creating rating:', error);
      return null;
    }
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/ratings`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch ratings');
      return data.ratings || [];
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch user');
      return data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user');
      if (this.currentUser?.id === userId) {
        this.currentUser = data.user;
      }
      return data.user;
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
    try {
      const response = await fetch(`${API_BASE}/api/fairness-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiator_listings: initiatorListings, recipient_listings: recipientListings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fairness check failed');
      return data;
    } catch (error) {
      console.error('Error checking fairness:', error);
      return null;
    }
  }
}

export const db = new DatabaseClient();
