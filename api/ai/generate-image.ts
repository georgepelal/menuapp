import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { verifyUserAndBusiness, enforceAiRateLimit, handleApiError } from '../_lib/verifyUser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { businessId, itemName, description } = req.body ?? {};
    await verifyUserAndBusiness(req, businessId);
    await enforceAiRateLimit(businessId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const prompt = `A professional, high-resolution food photography shot of ${itemName}. ${description}.
    Studio lighting, 4k, appetizing, centered, white plate, restaurant styling.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '1:1' } },
    });

    let image: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    res.status(200).json({ image });
  } catch (error) {
    handleApiError(res, error);
  }
}
