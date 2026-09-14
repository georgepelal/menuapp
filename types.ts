
export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string; // Base64 or URL
  dietary: DietaryType[];
  isAvailable: boolean;
  translations?: Record<string, { name: string; description: string }>;
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  translations?: Record<string, { name: string }>;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export type ThemeTemplate = 'modern' | 'classic' | 'dark' | 'minimal';

export interface Promotion {
  isActive: boolean;
  title: string;
  description: string;
  type: 'discount' | 'special' | 'event' | 'alert';
}

export interface BusinessProfile {
  name: string;
  type?: string; // e.g., 'Restaurant', 'Cafe', 'Bar', 'Hotel'
  description: string;
  currency: string;
  themeColor: string;
  themeTemplate: ThemeTemplate;
  logo?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  primaryLanguage: string;
  languages: Language[];
  promotion?: Promotion;
  // Pro Features Config
  enableSmartWaiter?: boolean;
  enableLeadCapture?: boolean;
  enableFeedback?: boolean;
  googleReviewUrl?: string; // For redirecting 5-star reviews
}

export enum DietaryType {
  VEGAN = 'VG',
  VEGETARIAN = 'V',
  GLUTEN_FREE = 'GF',
  SPICY = '🌶️',
  NUT_FREE = 'NF'
}

export const DIETARY_CONFIG: Record<DietaryType, { label: string, icon: string }> = {
  [DietaryType.VEGAN]: { label: 'Vegan', icon: '🌱' },
  [DietaryType.VEGETARIAN]: { label: 'Vegetarian', icon: '🧀' },
  [DietaryType.GLUTEN_FREE]: { label: 'Gluten Free', icon: '🌾' },
  [DietaryType.SPICY]: { label: 'Spicy', icon: '🌶️' },
  [DietaryType.NUT_FREE]: { label: 'Nut Free', icon: '🥜' }
};

export interface MenuStats {
  totalViews: number;
  itemClicks: Record<string, number>;
  lastReset: number;
}

export interface CustomerLead {
  id: string;
  email: string;
  name?: string;
  date: number;
  source: string;
}

export interface ServiceRequest {
  id: string;
  type: 'waiter' | 'bill' | 'water' | 'other';
  table?: string;
  status: 'pending' | 'completed';
  timestamp: number;
}

export interface CustomerFeedback {
  id: string;
  rating: number; // 1-5
  comment?: string;
  date: number;
  contact?: string;
}

export interface AppState {
  profile: BusinessProfile;
  categories: MenuCategory[];
  items: MenuItem[];
  stats: MenuStats;
  leads: CustomerLead[];
  serviceRequests: ServiceRequest[];
  feedback: CustomerFeedback[];
}

export type UserRole = 'owner' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
}

export interface Business {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  type?: string | null;
  description: string;
  currency: string;
  themeColor: string;
  themeTemplate: ThemeTemplate;
  logoUrl?: string | null;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  primaryLanguage: string;
  languages: Language[];
  promotion?: Promotion | null;
  enableSmartWaiter: boolean;
  enableLeadCapture: boolean;
  enableFeedback: boolean;
  googleReviewUrl?: string | null;
  isPublished: boolean;
}
