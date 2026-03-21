import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleCreatePortal } from '../stripe/portal.ts';

serve(handleCreatePortal);

