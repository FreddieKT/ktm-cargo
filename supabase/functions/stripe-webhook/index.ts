import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleStripeWebhook } from '../stripe/webhook.ts';

serve(handleStripeWebhook);
