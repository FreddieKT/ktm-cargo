export interface JsonError {
  message: string;
  code: string;
  details?: unknown;
}

export interface JsonEnvelope<T = unknown> {
  success: boolean;
  data: T | null;
  error: JsonError | null;
}

export interface LoggerMeta {
  [key: string]: unknown;
}

export interface CheckoutRequestBody {
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PortalRequestBody {
  returnUrl?: string;
}

export interface SupabaseProfile {
  stripe_customer_id?: string | null;
  email?: string | null;
  full_name?: string | null;
}
