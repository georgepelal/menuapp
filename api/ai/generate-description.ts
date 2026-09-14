import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserAndBusiness, enforceAiRateLimit, handleApiError } from '../_lib/verifyUser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { businessId, itemName, ingredients, tone = 'fancy', language = 'English' } = req.body ?? {};
    await verifyUserAndBusiness(req, businessId);
    await enforceAiRateLimit(businessId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `Write a short, appetizing menu description (max 25 words) for a dish named "${itemName}".
    The description MUST be written in ${language} language only.
    Key ingredients: ${ingredients}.
    Tone: ${tone}.
    Do not include the name of the dish in the description, just describe it.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    res.status(200).json({ description: response.text?.trim() || 'Delicious food prepared fresh.' });
  } catch (error) {
    handleApiError(res, error);
  }
}
