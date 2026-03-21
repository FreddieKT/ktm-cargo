import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import {
  AppError,
  AuthenticationError,
  ConfigurationError,
  ValidationError,
} from '../shared/errors.ts';
import { createLogger } from '../shared/logger.ts';
import { err, ok, preflightResponse } from '../shared/response.ts';
import type { PortalRequestBody } from '../shared/types.ts';

const logger = createLogger('stripe/portal');
const stripeApiVersion = '2024-04-10';

function createStripeClient(): Stripe {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new ConfigurationError('STRIPE_SECRET_KEY not configured');
  }

  return new Stripe(stripeKey, { apiVersion: stripeApiVersion });
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new ConfigurationError('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  return createClient(supabaseUrl, serviceKey);
}

async function authenticateUser(req: Request, supabase: ReturnType<typeof createSupabaseClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new AuthenticationError('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new AuthenticationError('Unauthorized');
  }

  return user;
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    logger.warn(error.message, {
      code: error.code,
      status: error.status,
      details: error.details,
    });
    return err(error.message, error.code, error.status, error.details);
  }

  logger.error('Unhandled portal error', { error });
  return err('Internal server error', 'internal_error', 500);
}

export async function handleCreatePortal(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return preflightResponse();
  }

  try {
    const stripe = createStripeClient();
    const supabase = createSupabaseClient();
    const user = await authenticateUser(req, supabase);
    const { returnUrl } = (await req.json()) as PortalRequestBody;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw new ValidationError('Unable to load profile', { error: error.message });
    }

    if (!profile?.stripe_customer_id) {
      throw new ValidationError('No active subscription found. Please subscribe first.');
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || 'https://localhost:5173/settings',
    });

    logger.info('Created Stripe portal session', {
      userId: user.id,
      customerId: profile.stripe_customer_id,
      sessionId: portalSession.id,
    });

    return ok({ url: portalSession.url });
  } catch (error) {
    return toErrorResponse(error);
  }
}
