import type { JsonEnvelope } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonHeaders(): HeadersInit {
  return {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function buildResponse<T>(body: JsonEnvelope<T>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(),
  });
}

export function ok<T>(data: T, status = 200): Response {
  return buildResponse(
    {
      success: true,
      data,
      error: null,
    },
    status
  );
}

export function err(message: string, code = 'error', status = 400, details?: unknown): Response {
  return buildResponse(
    {
      success: false,
      data: null,
      error: {
        message,
        code,
        ...(details === undefined ? {} : { details }),
      },
    },
    status
  );
}

export function preflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}
