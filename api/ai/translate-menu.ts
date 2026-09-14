import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserAndBusiness, enforceAiRateLimit, handleApiError } from '../_lib/verifyUser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { businessId, categories, items, targetLanguage } = req.body ?? {};
    await verifyUserAndBusiness(req, businessId);
    await enforceAiRateLimit(businessId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    const dataToTranslate = {
      categories: (categories ?? []).map((c: any) => ({ id: c.id, name: c.name })),
      items: (items ?? []).map((i: any) => ({ id: i.id, name: i.name, description: i.description })),
    };

    const prompt = `Translate the 'name' and 'description' fields in the following JSON object to ${targetLanguage}.
    Return ONLY valid JSON with the same structure, keys, and IDs. Do not translate IDs.

    JSON:
    ${JSON.stringify(dataToTranslate)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const translatedText = response.text?.trim();
    if (!translatedText) throw new Error('No translation returned');
    const result = JSON.parse(translatedText);

    const categoryMap: Record<string, { name: string }> = {};
    const itemMap: Record<string, { name: string; description: string }> = {};
    result.categories?.forEach((c: any) => {
      categoryMap[c.id] = { name: c.name };
    });
    result.items?.forEach((i: any) => {
      itemMap[i.id] = { name: i.name, description: i.description };
    });

    res.status(200).json({ categories: categoryMap, items: itemMap });
  } catch (error) {
    handleApiError(res, error);
  }
}
