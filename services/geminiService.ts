import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, MenuCategory } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
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
    const ai = getAiClient();
    const prompt = `Write a short, appetizing menu description (max 25 words) for a dish named "${itemName}". 
    The description MUST be written in ${language} language only.
    Key ingredients: ${ingredients}. 
    Tone: ${tone}. 
    Do not include the name of the dish in the description, just describe it.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Delicious food prepared fresh.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "A delicious choice from our kitchen.";
  }
};

/**
 * Generates a photorealistic image of the food item.
 */
export const generateMenuImage = async (itemName: string, description: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const prompt = `A professional, high-resolution food photography shot of ${itemName}. ${description}. 
    Studio lighting, 4k, appetizing, centered, white plate, restaurant styling.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract image from response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
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
): Promise<{ categories: Record<string, {name: string}>, items: Record<string, {name: string, description: string}> }> => {
  try {
    const ai = getAiClient();
    
    // Prepare minimal data structure to reduce token usage
    const dataToTranslate = {
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      items: items.map(i => ({ id: i.id, name: i.name, description: i.description }))
    };

    const prompt = `Translate the 'name' and 'description' fields in the following JSON object to ${targetLanguage}. 
    Return ONLY valid JSON with the same structure, keys, and IDs. Do not translate IDs.
    
    JSON:
    ${JSON.stringify(dataToTranslate)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const translatedText = response.text?.trim();
    if (!translatedText) throw new Error("No translation returned");

    const result = JSON.parse(translatedText);
    
    // Transform back to efficient lookup maps
    const categoryMap: Record<string, {name: string}> = {};
    const itemMap: Record<string, {name: string, description: string}> = {};

    result.categories?.forEach((c: any) => {
      categoryMap[c.id] = { name: c.name };
    });
    
    result.items?.forEach((i: any) => {
      itemMap[i.id] = { name: i.name, description: i.description };
    });

    return { categories: categoryMap, items: itemMap };

  } catch (error) {
    console.error("Translation error:", error);
    return { categories: {}, items: {} };
  }
};

/**
 * Translates a single menu item to multiple target languages.
 */
export const translateMenuItem = async (
  name: string, 
  description: string, 
  targetLangs: {code: string, name: string}[]
): Promise<Record<string, {name: string, description: string}>> => {
  try {
    const ai = getAiClient();
    
    const langPrompt = targetLangs.map(l => `${l.code} (${l.name})`).join(', ');

    const prompt = `Translate the following menu item to these languages: ${langPrompt}.
    
    Item Name: "${name}"
    Item Description: "${description}"
    
    Return a JSON object where the keys are the language codes (e.g. "es", "fr") and values are objects with "name" and "description" fields containing the translations.
    Example output format:
    {
      "es": { "name": "Hamburguesa", "description": "Deliciosa..." },
      "fr": { "name": "Burger", "description": "Délicieux..." }
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Item translation error", e);
    return {};
  }
};

/**
 * Generate marketing copy for promotions
 */
export const generateMarketingCopy = async (
  goal: string,
  language: string = 'English'
): Promise<{title: string, description: string}> => {
  try {
    const ai = getAiClient();
    const prompt = `Write a short, catchy promotion title (max 5 words) and a description (max 15 words) for a restaurant banner.
    Goal: ${goal} (e.g., Happy Hour, Valentine's, Lunch Special).
    Language: ${language}.
    
    Return JSON: { "title": "...", "description": "..." }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(response.text || '{"title": "Special Offer", "description": "Ask our staff about daily specials."}');
  } catch (e) {
    return { title: "Special Offer", description: "Ask our staff about today's specials!" };
  }
};

/**
 * Parses a physical menu image to extract categories and items.
 */
export const parseMenuFromImage = async (
  base64Image: string
): Promise<Array<{ categoryName: string, items: Array<{ name: string, description: string, price: number, dietary: string[] }> }>> => {
  try {
    const ai = getAiClient();
    
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `Analyze this image of a restaurant menu. Extract all menu categories and their dishes.
    Extract the dish name, description (if present), price (as a number), and any dietary indicators (like VG, GF, etc).
    Return the data in a structured JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png, API handles conversion usually
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            menu: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        dietary: { 
                          type: Type.ARRAY, 
                          items: { type: Type.STRING } 
                        }
                      },
                      required: ["name", "price"]
                    }
                  }
                },
                required: ["categoryName", "items"]
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data extracted");

    const result = JSON.parse(jsonText);
    return result.menu || [];

  } catch (error) {
    console.error("Error parsing menu image:", error);
    return [];
  }
};