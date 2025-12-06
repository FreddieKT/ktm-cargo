import { toast } from 'sonner';
import * as Sentry from '@sentry/react';

/**
 * Enhanced Error Handler Hook
 * Provides comprehensive error handling with Sentry integration
 */
export const useErrorHandler = () => {
  const handleError = (error, customMessage = 'An unexpected error occurred', context = {}) => {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[Error Handler]', error, context);
    }

    // Ensure we have a proper Error instance for Sentry
    let errorToCapture = error;
    
    // If error is not an Error instance (e.g., plain object), convert it
    if (!(error instanceof Error)) {
      const errorMessage = error?.message || error?.details || error?.hint || customMessage;
      errorToCapture = new Error(errorMessage);
      errorToCapture.name = error?.name || 'ApplicationError';
      
      // Preserve original error properties
      if (error?.code) errorToCapture.code = error.code;
      if (error?.details) errorToCapture.details = error.details;
      if (error?.hint) errorToCapture.hint = error.hint;
      errorToCapture.originalError = error;
    }

    // Capture in Sentry with full context
    Sentry.captureException(errorToCapture, {
      tags: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        ...context.tags,
      },
      extra: {
        customMessage,
        userContext: context.user,
        data: context.data,
        originalError: error instanceof Error ? undefined : error,
        ...context.extra,
      },
      level: context.level || 'error',
    });

    // Extract user-friendly message
    let message = customMessage;
    
    // Handle Supabase/PostgREST errors (they have code, details, hint, message structure)
    if (error?.code && error?.message) {
      // This is a Supabase error
      const supabaseMessage = error.message;
      const supabaseDetails = error.details;
      const supabaseHint = error.hint;
      
      // Common Supabase error codes and user-friendly messages
      const errorMessages = {
        '23505': 'This record already exists. Please check for duplicates.',
        '23503': 'Cannot create this record. Related data is missing or invalid.',
        '23502': 'Required field is missing. Please fill in all required fields.',
        '42501': 'You do not have permission to perform this action.',
        'PGRST116': 'No rows found. The record may have been deleted.',
        'PGRST301': 'Invalid request. Please check your input data.',
      };
      
      // Use specific error message if available
      if (errorMessages[error.code]) {
        message = errorMessages[error.code];
      } else if (supabaseDetails) {
        // Use details if available (often more descriptive)
        message = supabaseDetails;
      } else if (supabaseMessage && supabaseMessage.length < 150) {
        // Use message if it's reasonable length
        message = supabaseMessage;
      } else if (supabaseHint) {
        // Fall back to hint
        message = supabaseHint;
      }
      
      // Add context for debugging
      if (import.meta.env.DEV && supabaseHint) {
        console.warn('[Supabase Error Hint]', supabaseHint);
      }
    } else if (error?.message) {
      // Handle regular errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        message = error.message;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        message = 'You do not have permission to perform this action';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        message = 'Network error. Please check your connection and try again.';
      } else if (error.message.length < 100) {
        // Use error message if it's short and user-friendly
        message = error.message;
      }
    }

    // Show user-friendly toast
    toast.error(message, {
      duration: 5000,
      description: import.meta.env.DEV ? error?.stack?.split('\n')[0] : undefined,
    });

    return { message, error };
  };

  const handleValidationError = (error, fieldName = 'field') => {
    // Handle Zod errors specifically
    if (error && typeof error === 'object' && 'errors' in error) {
      // This is a ZodError
      const zodError = error;
      const firstError = zodError.errors?.[0];
      const message = firstError?.message || `${fieldName} validation failed`;
      const field = firstError?.path?.join('.') || fieldName;
      
      // Capture in Sentry with Zod-specific context
      Sentry.captureException(zodError, {
        tags: {
          component: 'validation',
          action: 'validate',
          field: field,
          errorType: 'ZodValidationError',
        },
        extra: {
          fieldName: field,
          errors: zodError.errors,
          errorCount: zodError.errors?.length || 0,
        },
        level: 'warning',
      });
      
      toast.error(message, {
        duration: 5000,
      });
      
      return { message, error: zodError, field };
    }
    
    // Fallback for non-Zod validation errors
    const message = error?.message || error?.errors?.[0]?.message || `${fieldName} validation failed`;
    return handleError(error, message, {
      component: 'validation',
      action: 'validate',
      tags: { field: fieldName },
      level: 'warning',
    });
  };

  const handlePermissionError = (error, action = 'perform this action') => {
    return handleError(error, `You do not have permission to ${action}`, {
      component: 'rbac',
      action: 'permission_check',
      tags: { type: 'permission_denied' },
      level: 'warning',
    });
  };

  return {
    handleError,
    handleValidationError,
    handlePermissionError,
  };
};
