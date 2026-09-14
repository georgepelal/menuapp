import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS entirely, so it must never be imported
// by anything that ships to the browser — only these /api serverless
// functions run with access to SUPABASE_SERVICE_ROLE_KEY.
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface VerifiedContext {
  userId: string;
  businessId: string;
}

/**
 * Verifies the caller's Supabase session JWT and that they own the business
 * they claim to be acting for. Every /api/ai/* handler must call this before
 * touching Gemini — it's what stops one signed-in owner from spending
 * another business's AI quota.
 */
export const verifyUserAndBusiness = async (req: VercelRequest, businessId: string | undefined): Promise<VerifiedContext> => {
  if (!businessId) throw new HttpError(400, 'Missing businessId');

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Missing Authorization header');

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) throw new HttpError(401, 'Invalid or expired session');

  const { data: business, error: businessError } = await supabaseAdmin
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .maybeSingle();
  if (businessError) throw new HttpError(500, businessError.message);
  if (!business || business.owner_id !== userData.user.id) {
    throw new HttpError(403, 'Not authorized for this business');
  }

  return { userId: userData.user.id, businessId };
};

/**
 * Atomically increments today's AI usage counter for a business and throws
 * a 429 if that pushes it over AI_DAILY_LIMIT_PER_BUSINESS.
 */
export const enforceAiRateLimit = async (businessId: string): Promise<void> => {
  const limit = parseInt(process.env.AI_DAILY_LIMIT_PER_BUSINESS || '50', 10);
  const { data: withinLimit, error } = await supabaseAdmin.rpc('increment_ai_usage', {
    p_business_id: businessId,
    p_limit: limit,
  });
  if (error) throw new HttpError(500, error.message);
  if (!withinLimit) throw new HttpError(429, 'Daily AI usage limit reached for this business. Try again tomorrow.');
};

export const handleApiError = (res: { status: (code: number) => any }, error: unknown) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
};
