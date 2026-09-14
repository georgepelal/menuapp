import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserAndBusiness, enforceAiRateLimit, handleApiError } from '../_lib/verifyUser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { businessId, goal, language = 'English' } = req.body ?? {};
    await verifyUserAndBusiness(req, businessId);
    await enforceAiRateLimit(businessId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `Write a short, catchy promotion title (max 5 words) and a description (max 15 words) for a restaurant banner.
    Goal: ${goal} (e.g., Happy Hour, Valentine's, Lunch Special).
    Language: ${language}.

    Return JSON: { "title": "...", "description": "..." }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(
      response.text || '{"title": "Special Offer", "description": "Ask our staff about daily specials."}'
    );
    res.status(200).json(parsed);
  } catch (error) {
    handleApiError(res, error);
  }
}
