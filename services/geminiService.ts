import { MenuItem, MenuCategory } from '../types';
import { supabase } from './supabaseClient';
import { ACTIVE_BUSINESS_STORAGE_KEY } from './constants';

// Every function here used to call GoogleGenAI directly from the browser,
// which shipped the Gemini API key to every visitor. They now proxy through
// /api/ai/* serverless functions (see api/_lib/verifyUser.ts) that hold the
// key server-side and enforce per-business auth + rate limiting. Exported
// names/signatures are unchanged so callers in AdminDashboard didn't need
// to change.
const callAiProxy = async <T,>(endpoint: string, body: Record<string, unknown>): Promise<T> => {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const businessId = localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
  if (!session || !businessId) throw new Error('Not signed in');

  const response = await fetch(`/api/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ businessId, ...body }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'AI request failed');
  }
  return response.json();
};

/**
 * Generates an appetizing description for a menu item.
 */
export const generateMenuDescription = async (
  itemName: string,
  ingredients: string,
  tone: 'fancy' | 'casual' | 'fun' = 'fancy',
  language: string = 'English'
): Promise<string> => {
  try {
    const { description } = await callAiProxy<{ description: string }>('generate-description', {
      itemName,
      ingredients,
      tone,
      language,
    });
    return description;
  } catch (error) {
    console.error('Error generating description:', error);
    return 'A delicious choice from our kitchen.';
  }
};

/**
 * Generates a photorealistic image of the food item.
 */
export const generateMenuImage = async (itemName: string, description: string): Promise<string | null> => {
  try {
    const { image } = await callAiProxy<{ image: string | null }>('generate-image', { itemName, description });
    return image;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
};

/**
 * Translates the entire menu structure to a target language.
 */
export const translateMenu = async (
  categories: MenuCategory[],
  items: MenuItem[],
  targetLanguage: string
): Promise<{ categories: Record<string, { name: string }>; items: Record<string, { name: string; description: string }> }> => {
  try {
    return await callAiProxy('translate-menu', { categories, items, targetLanguage });
  } catch (error) {
    console.error('Translation error:', error);
    return { categories: {}, items: {} };
  }
};

/**
 * Generate marketing copy for promotions
 */
export const generateMarketingCopy = async (
  goal: string,
  language: string = 'English'
): Promise<{ title: string; description: string }> => {
  try {
    return await callAiProxy('marketing-copy', { goal, language });
  } catch (e) {
    return { title: 'Special Offer', description: "Ask our staff about today's specials!" };
  }
};

/**
 * Parses a physical menu image to extract categories and items.
 */
export const parseMenuFromImage = async (
  base64Image: string
): Promise<Array<{ categoryName: string; items: Array<{ name: string; description: string; price: number; dietary: string[] }> }>> => {
  try {
    const { menu } = await callAiProxy<{ menu: any[] }>('parse-menu-image', { base64Image });
    return menu || [];
  } catch (error) {
    console.error('Error parsing menu image:', error);
    return [];
  }
};
