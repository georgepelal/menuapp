import { supabase } from './supabaseClient';
import { slugify, withRandomSuffix } from './slug';
import {
  Business,
  Profile,
  BusinessProfile,
  MenuCategory,
  MenuItem,
  CustomerLead,
  ServiceRequest,
  CustomerFeedback,
} from '../types';

const POSTGRES_UNIQUE_VIOLATION = '23505';

const mapProfile = (row: any): Profile => ({
  id: row.id,
  email: row.email,
  role: row.role,
  displayName: row.display_name,
});

const mapBusiness = (row: any): Business => ({
  id: row.id,
  ownerId: row.owner_id,
  slug: row.slug,
  name: row.name,
  type: row.type,
  description: row.description,
  currency: row.currency,
  themeColor: row.theme_color,
  themeTemplate: row.theme_template,
  logoUrl: row.logo_url,
  wifiSsid: row.wifi_ssid,
  wifiPassword: row.wifi_password,
  primaryLanguage: row.primary_language,
  languages: row.languages ?? [],
  promotion: row.promotion,
  enableSmartWaiter: row.enable_smart_waiter,
  enableLeadCapture: row.enable_lead_capture,
  enableFeedback: row.enable_feedback,
  googleReviewUrl: row.google_review_url,
  isPublished: row.is_published,
});

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
};

export const fetchBusinessesForOwner = async (ownerId: string): Promise<Business[]> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapBusiness);
};

/**
 * Creates a business with a unique slug derived from `name`, retrying with a
 * random suffix on a slug collision (Postgres unique_violation, 23505).
 */
export const createBusiness = async (
  ownerId: string,
  name: string,
  defaults?: { currency?: string; primaryLanguage?: string; languages?: Business['languages'] }
): Promise<Business> => {
  let slug = slugify(name);

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: ownerId,
        slug,
        name,
        currency: defaults?.currency ?? '$',
        primary_language: defaults?.primaryLanguage ?? 'en',
        languages: defaults?.languages ?? [{ code: 'en', name: 'English', flag: '🇺🇸' }],
      })
      .select('*')
      .single();

    if (!error) return mapBusiness(data);
    if (error.code !== POSTGRES_UNIQUE_VIOLATION) throw error;
    slug = withRandomSuffix(slugify(name));
  }

  throw new Error('Could not generate a unique business URL. Please try a different name.');
};

export interface SuperAdminBusinessRow extends Business {
  ownerEmail: string;
  itemCount: number;
  categoryCount: number;
}

/**
 * All businesses across every owner, with item/category counts — readable
 * only by a super_admin thanks to the RLS policies on `businesses`,
 * `categories`, and `menu_items` (this milestone keeps Super Admin read-only,
 * so there is no corresponding delete/update function here).
 */
export const fetchAllBusinessesForSuperAdmin = async (): Promise<SuperAdminBusinessRow[]> => {
  const [{ data: businessRows, error: businessError }, { data: summaryRows, error: summaryError }] =
    await Promise.all([
      supabase.from('businesses').select('*, profiles(email)'),
      supabase.from('v_business_summary').select('*'),
    ]);

  if (businessError) throw businessError;
  if (summaryError) throw summaryError;

  const summaryByBusiness = new Map((summaryRows ?? []).map((r: any) => [r.business_id, r]));

  return (businessRows ?? []).map((row: any) => {
    const summary = summaryByBusiness.get(row.id);
    return {
      ...mapBusiness(row),
      ownerEmail: row.profiles?.email ?? 'unknown',
      itemCount: summary?.item_count ?? 0,
      categoryCount: summary?.category_count ?? 0,
    };
  });
};

export const fetchPublicBusinessByListSlug = async (slug: string): Promise<Business | null> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBusiness(data) : null;
};

// ============================================================================
// Business profile — kept field-compatible with the legacy `BusinessProfile`
// type so AdminDashboard's existing JSX needs minimal changes.
// ============================================================================

const BUSINESS_PROFILE_COLUMN_MAP: Record<keyof BusinessProfile, string> = {
  name: 'name',
  type: 'type',
  description: 'description',
  currency: 'currency',
  themeColor: 'theme_color',
  themeTemplate: 'theme_template',
  logo: 'logo_url',
  wifiSsid: 'wifi_ssid',
  wifiPassword: 'wifi_password',
  primaryLanguage: 'primary_language',
  languages: 'languages',
  promotion: 'promotion',
  enableSmartWaiter: 'enable_smart_waiter',
  enableLeadCapture: 'enable_lead_capture',
  enableFeedback: 'enable_feedback',
  googleReviewUrl: 'google_review_url',
};

export const businessToProfile = (business: Business): BusinessProfile => ({
  name: business.name,
  type: business.type ?? undefined,
  description: business.description,
  currency: business.currency,
  themeColor: business.themeColor,
  themeTemplate: business.themeTemplate,
  logo: business.logoUrl ?? undefined,
  wifiSsid: business.wifiSsid ?? undefined,
  wifiPassword: business.wifiPassword ?? undefined,
  primaryLanguage: business.primaryLanguage,
  languages: business.languages,
  promotion: business.promotion ?? undefined,
  enableSmartWaiter: business.enableSmartWaiter,
  enableLeadCapture: business.enableLeadCapture,
  enableFeedback: business.enableFeedback,
  googleReviewUrl: business.googleReviewUrl ?? undefined,
});

export const updateBusinessProfileField = async <K extends keyof BusinessProfile>(
  businessId: string,
  field: K,
  value: BusinessProfile[K]
): Promise<Business> => {
  const column = BUSINESS_PROFILE_COLUMN_MAP[field];
  const { data, error } = await supabase
    .from('businesses')
    .update({ [column]: value })
    .eq('id', businessId)
    .select('*')
    .single();
  if (error) throw error;
  return mapBusiness(data);
};

// ============================================================================
// Categories
// ============================================================================

const mapCategory = (row: any): MenuCategory => ({
  id: row.id,
  name: row.name,
  order: row.sort_order,
  translations: row.translations,
});

export const fetchCategories = async (businessId: string): Promise<MenuCategory[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCategory);
};

export const addCategory = async (businessId: string, name: string, order: number): Promise<MenuCategory> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ business_id: businessId, name, sort_order: order })
    .select('*')
    .single();
  if (error) throw error;
  return mapCategory(data);
};

export const renameCategory = async (categoryId: string, name: string): Promise<MenuCategory> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', categoryId)
    .select('*')
    .single();
  if (error) throw error;
  return mapCategory(data);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  // ON DELETE CASCADE on menu_items.category_id removes its items too.
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
};

// ============================================================================
// Menu items
// ============================================================================

const mapMenuItem = (row: any): MenuItem => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  image: row.image_url ?? undefined,
  dietary: row.dietary ?? [],
  isAvailable: row.is_available,
  translations: row.translations,
});

export const fetchMenuItems = async (businessId: string): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMenuItem);
};

export const addMenuItem = async (
  businessId: string,
  item: Omit<MenuItem, 'id'>
): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      business_id: businessId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image ?? null,
      dietary: item.dietary,
      is_available: item.isAvailable,
      translations: item.translations ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMenuItem(data);
};

export const updateMenuItem = async (itemId: string, item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update({
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image ?? null,
      dietary: item.dietary,
      is_available: item.isAvailable,
      translations: item.translations ?? {},
    })
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) throw error;
  return mapMenuItem(data);
};

export const deleteMenuItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
  if (error) throw error;
};

export const setItemAvailability = async (itemId: string, isAvailable: boolean): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) throw error;
  return mapMenuItem(data);
};

export const setItemTranslation = async (
  itemId: string,
  translations: MenuItem['translations']
): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ translations })
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) throw error;
  return mapMenuItem(data);
};

/**
 * Uploads a menu-item photo (from a file input or an AI-generated base64
 * image converted to a Blob) to the `menu-images` Storage bucket and
 * returns its public URL. Never stores base64 in the database.
 */
export const uploadItemImage = async (businessId: string, itemId: string, file: Blob, ext = 'jpg'): Promise<string> => {
  const path = `${businessId}/${itemId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
  return data.publicUrl;
};

export const base64ToBlob = (base64: string): { blob: Blob; ext: string } => {
  const match = base64.match(/^data:image\/(\w+);base64,(.*)$/);
  const mimeExt = match?.[1] ?? 'png';
  const raw = match?.[2] ?? base64;
  const byteChars = atob(raw);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  return { blob: new Blob([byteArray], { type: `image/${mimeExt}` }), ext: mimeExt };
};

export const importScannedMenu = async (businessId: string, payload: unknown): Promise<void> => {
  const { error } = await supabase.rpc('import_scanned_menu', {
    p_business_id: businessId,
    p_payload: payload,
  });
  if (error) throw error;
};

// ============================================================================
// Leads / Service Requests / Feedback / Stats
// ============================================================================

const mapLead = (row: any): CustomerLead => ({
  id: row.id,
  email: row.email,
  name: row.name ?? undefined,
  date: new Date(row.created_at).getTime(),
  source: row.source,
});

export const fetchLeads = async (businessId: string): Promise<CustomerLead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLead);
};

const mapServiceRequest = (row: any): ServiceRequest => ({
  id: row.id,
  type: row.type,
  table: row.table_number ?? undefined,
  status: row.status,
  timestamp: new Date(row.created_at).getTime(),
});

export const fetchServiceRequests = async (businessId: string): Promise<ServiceRequest[]> => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapServiceRequest);
};

export const completeServiceRequest = async (requestId: string): Promise<ServiceRequest> => {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*')
    .single();
  if (error) throw error;
  return mapServiceRequest(data);
};

const mapFeedback = (row: any): CustomerFeedback => ({
  id: row.id,
  rating: row.rating,
  comment: row.comment ?? undefined,
  date: new Date(row.created_at).getTime(),
  contact: row.contact ?? undefined,
});

export const fetchFeedback = async (businessId: string): Promise<CustomerFeedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapFeedback);
};

// ============================================================================
// Public menu (anonymous diner) — reads and write-only inserts, both
// protected by the RLS policies in supabase/schema.sql rather than app logic.
// ============================================================================

export interface PublicMenuBundle {
  business: Business;
  categories: MenuCategory[];
  items: MenuItem[];
}

export const fetchPublicMenuBundle = async (slug: string): Promise<PublicMenuBundle | null> => {
  const business = await fetchPublicBusinessByListSlug(slug);
  if (!business) return null;

  const [{ data: categoryRows, error: categoryError }, { data: itemRows, error: itemError }] = await Promise.all([
    supabase.from('categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    supabase.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
  ]);
  if (categoryError) throw categoryError;
  if (itemError) throw itemError;

  return {
    business,
    categories: (categoryRows ?? []).map(mapCategory),
    items: (itemRows ?? []).map(mapMenuItem),
  };
};

export const recordMenuView = async (businessId: string): Promise<void> => {
  const { error } = await supabase.from('menu_views').insert({ business_id: businessId });
  if (error) throw error;
};

export const recordItemClick = async (businessId: string, itemId: string): Promise<void> => {
  const { error } = await supabase.from('item_clicks').insert({ business_id: businessId, item_id: itemId });
  if (error) throw error;
};

export const submitLead = async (businessId: string, email: string, name?: string): Promise<void> => {
  const { error } = await supabase.from('leads').insert({ business_id: businessId, email, name, source: 'menu_popup' });
  if (error) throw error;
};

export const submitServiceRequest = async (
  businessId: string,
  type: 'waiter' | 'bill' | 'water' | 'other',
  tableNumber?: string
): Promise<void> => {
  const { error } = await supabase
    .from('service_requests')
    .insert({ business_id: businessId, type, table_number: tableNumber });
  if (error) throw error;
};

export const submitFeedback = async (
  businessId: string,
  rating: number,
  comment?: string,
  contact?: string
): Promise<void> => {
  const { error } = await supabase.from('feedback').insert({ business_id: businessId, rating, comment, contact });
  if (error) throw error;
};

export interface BusinessStats {
  totalViews: number;
  itemClicks: Record<string, number>;
}

export const fetchStats = async (businessId: string): Promise<BusinessStats> => {
  const [{ data: viewRows, error: viewError }, { data: clickRows, error: clickError }] = await Promise.all([
    supabase.from('v_business_view_counts').select('*').eq('business_id', businessId).maybeSingle(),
    supabase.from('v_item_click_counts').select('*').eq('business_id', businessId),
  ]);
  if (viewError) throw viewError;
  if (clickError) throw clickError;

  const itemClicks: Record<string, number> = {};
  (clickRows ?? []).forEach((row: any) => {
    itemClicks[row.item_id] = row.clicks;
  });

  return { totalViews: viewRows?.total_views ?? 0, itemClicks };
};
