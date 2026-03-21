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
import type { CheckoutRequestBody, SupabaseProfile } from '../shared/types.ts';

const logger = createLogger('stripe/checkout');
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

async function loadProfile(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('Unable to load profile', {
      userId,
      error: error.message,
    });
    return null;
  }

  return data ?? null;
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

  logger.error('Unhandled checkout error', { error });
  return err('Internal server error', 'internal_error', 500);
}

export async function handleCreateCheckout(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return preflightResponse();
  }

  try {
    const stripe = createStripeClient();
    const supabase = createSupabaseClient();
    const user = await authenticateUser(req, supabase);
    let payload: CheckoutRequestBody;
    try {
      payload = (await req.json()) as CheckoutRequestBody;
    } catch (error) {
      throw new ValidationError('Invalid JSON body', error);
    }

    const { priceId, successUrl, cancelUrl } = payload;

    if (!priceId) {
      throw new ValidationError('Missing priceId');
    }

    const profile = await loadProfile(supabase, user.id);
    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name: profile?.full_name || user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      const { error } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (error) {
        logger.warn('Failed to persist Stripe customer ID', {
          userId: user.id,
          error: error.message,
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://localhost:5173/settings?status=success',
      cancel_url: cancelUrl || 'https://localhost:5173/settings?status=cancelled',
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
    });

    if (!session.url) {
      throw new ValidationError('Stripe did not return a checkout URL');
    }

    logger.info('Created Stripe checkout session', {
      userId: user.id,
      customerId,
      sessionId: session.id,
    });

    return ok({ url: session.url });
  } catch (error) {
    return toErrorResponse(error);
  }
}
