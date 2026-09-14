import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyUserAndBusiness, enforceAiRateLimit, handleApiError } from '../_lib/verifyUser';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }, // menu photos can be large base64 payloads
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { businessId, base64Image } = req.body ?? {};
    await verifyUserAndBusiness(req, businessId);
    await enforceAiRateLimit(businessId);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const cleanBase64 = String(base64Image).replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const prompt = `Analyze this image of a restaurant menu. Extract all menu categories and their dishes.
    Extract the dish name, description (if present), price (as a number), and any dietary indicators (like VG, GF, etc).
    Return the data in a structured JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
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
                        dietary: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['name', 'price'],
                    },
                  },
                },
                required: ['categoryName', 'items'],
              },
            },
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error('No data extracted');
    const result = JSON.parse(jsonText);

    res.status(200).json({ menu: result.menu || [] });
  } catch (error) {
    handleApiError(res, error);
  }
}
