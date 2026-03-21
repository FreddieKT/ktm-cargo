import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import {
  AppError,
  ConfigurationError,
  StripeWebhookError,
  UpstreamError,
} from '../shared/errors.ts';
import { createLogger } from '../shared/logger.ts';
import { err, ok } from '../shared/response.ts';

const logger = createLogger('stripe/webhook');
const stripeApiVersion = '2024-04-10';
const tierMap: Record<string, string> = {
  price_pro_monthly: 'pro',
  price_enterprise_monthly: 'enterprise',
};

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

function priceIdToTier(priceId: string): string {
  return tierMap[priceId] || 'pro';
}

async function updateSubscription(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price?.id || '';
  const tier = priceIdToTier(priceId);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_stripe_id: subscription.id,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new UpstreamError('Failed to update subscription by user id', {
      userId,
      error: error.message,
    });
  }
}

async function updateSubscriptionByCustomerId(
  supabase: ReturnType<typeof createSupabaseClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id || '';
  const tier = priceIdToTier(priceId);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_stripe_id: subscription.id,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    throw new UpstreamError('Failed to update subscription by customer id', {
      customerId,
      error: error.message,
    });
  }
}

async function markSubscriptionCanceled(
  supabase: ReturnType<typeof createSupabaseClient>,
  where: { id?: string; stripe_customer_id?: string }
) {
  const baseUpdate = {
    subscription_status: 'canceled',
    subscription_tier: 'free',
    subscription_current_period_end: null,
  };

  if (where.id) {
    const { error } = await supabase.from('profiles').update(baseUpdate).eq('id', where.id);
    if (error) {
      throw new UpstreamError('Failed to cancel subscription', {
        ...where,
        error: error.message,
      });
    }
    return;
  }

  if (!where.stripe_customer_id) {
    throw new StripeWebhookError('Missing customer identifier for canceled subscription');
  }

  const { error } = await supabase
    .from('profiles')
    .update(baseUpdate)
    .eq('stripe_customer_id', where.stripe_customer_id);

  if (error) {
    throw new UpstreamError('Failed to cancel subscription', {
      ...where,
      error: error.message,
    });
  }
}

async function markPastDue(supabase: ReturnType<typeof createSupabaseClient>, customerId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    throw new UpstreamError('Failed to mark subscription past due', {
      customerId,
      error: error.message,
    });
  }
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

  if (error instanceof Error) {
    logger.error('Unhandled webhook error', { error });
    return err('Internal server error', 'internal_error', 500);
  }

  logger.error('Unhandled webhook error', { error });
  return err('Internal server error', 'internal_error', 500);
}

export async function handleStripeWebhook(req: Request): Promise<Response> {
  try {
    const stripe = createStripeClient();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new ConfigurationError('STRIPE_WEBHOOK_SECRET not configured');
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new StripeWebhookError('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      logger.warn('Webhook signature verification failed', { error });
      throw new StripeWebhookError('Webhook signature verification failed');
    }

    const supabase = createSupabaseClient();
    logger.info('Processing Stripe event', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await updateSubscription(supabase, userId, subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await updateSubscription(supabase, userId, subscription);
        } else {
          await updateSubscriptionByCustomerId(supabase, subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await markSubscriptionCanceled(supabase, { id: userId });
        } else {
          await markSubscriptionCanceled(supabase, {
            stripe_customer_id: subscription.customer as string,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await markPastDue(supabase, invoice.customer as string);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            await updateSubscription(supabase, userId, subscription);
          } else {
            await updateSubscriptionByCustomerId(supabase, subscription);
          }
        } else if (invoice.customer) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
            })
            .eq('stripe_customer_id', invoice.customer as string);

          if (error) {
            throw new UpstreamError('Failed to mark invoice payment as active', {
              customerId: invoice.customer as string,
              error: error.message,
            });
          }
        }
        break;
      }

      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    return ok({ received: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
