export interface User {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  australian_verified: boolean;
  verification_tier: 'unverified' | 'verified' | 'trusted' | 'elite';
  address_line1: string | null;
  address_line2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  phone: string | null;
  total_swaps: number;
  rating: number;
  positive_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Fragrance {
  id: string;
  name: string;
  house: string;
  concentration: string | null;
  top_notes: string[];
  mid_notes: string[];
  base_notes: string[];
  accords: string[];
  gender: string | null;
  release_year: number | null;
  fragrantica_url: string | null;
  image_url: string | null;
  avg_market_value: number | null;
  created_at: string;
}

export interface SwapPreferences {
  specific_fragrances?: string[];
  designer_or_niche?: 'designer' | 'niche' | 'both';
  gender_preference?: 'masculine' | 'feminine' | 'unisex' | 'any';
  scent_families?: string[];
  seasons?: string[];
  swap_ratio?: string;
  willing_to_add_decants?: boolean;
}

export interface Listing {
  id: string;
  user_id: string;
  fragrance_id: string | null;
  custom_name: string | null;
  house: string | null;
  concentration: string | null;
  size_ml: number;
  fill_percentage: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  batch_code: string | null;
  description: string | null;
  photos: string[];
  swap_preferences: SwapPreferences | null;
  is_active: boolean;
  estimated_value: number | null;
  created_at: string;
  updated_at: string;
  user?: User;
  fragrance?: Fragrance;
}

export interface Swap {
  id: string;
  initiator_id: string;
  recipient_id: string;
  initiator_listings: string[];
  recipient_listings: string[];
  status: 'proposed' | 'negotiating' | 'accepted' | 'locked' | 'shipping' | 'completed' | 'cancelled' | 'disputed';
  fairness_score: number | null;
  ai_assessment: string | null;
  initiator_tracking: string | null;
  recipient_tracking: string | null;
  initiator_shipped_at: string | null;
  recipient_shipped_at: string | null;
  initiator_received_at: string | null;
  recipient_received_at: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  completed_at: string | null;
  initiator?: User;
  recipient?: User;
  initiator_listing_details?: Listing[];
  recipient_listing_details?: Listing[];
}

export interface Message {
  id: string;
  swap_id: string;
  sender_id: string;
  message: string;
  is_ai_mediation: boolean;
  created_at: string;
  sender?: User;
}

export interface Rating {
  id: string;
  swap_id: string;
  rater_id: string;
  ratee_id: string;
  accuracy_score: number;
  packaging_score: number;
  communication_score: number;
  timeliness_score: number;
  overall_score: number;
  review: string | null;
  created_at: string;
  rater?: User;
}

export interface Wishlist {
  id: string;
  user_id: string;
  fragrance_id: string | null;
  custom_search: string | null;
  preferences: SwapPreferences | null;
  created_at: string;
  fragrance?: Fragrance;
}
