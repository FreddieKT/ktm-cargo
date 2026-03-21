import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleCreateCheckout } from '../stripe/checkout.ts';

serve(handleCreateCheckout);
