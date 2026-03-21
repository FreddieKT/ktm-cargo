export interface AppErrorOptions {
  code?: string;
  status?: number;
  details?: unknown;
}

export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = options.code ?? 'app_error';
    this.status = options.status ?? 400;
    this.details = options.details;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'configuration_error',
      status: 500,
      details,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, {
      code: 'unauthorized',
      status: 401,
      details,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'validation_error',
      status: 400,
      details,
    });
  }
}

export class StripeWebhookError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'stripe_webhook_error',
      status: 400,
      details,
    });
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, {
      code: 'upstream_error',
      status: 502,
      details,
    });
  }
}
