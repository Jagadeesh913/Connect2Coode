import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export interface StandardApiError {
  statusCode?: number;
  message?: string;
  errors?: string[] | Record<string, string> | null;
  data?: any;
}

/**
 * Extracts specific error messages from C2CResponse or standard backend errors
 */
export const parseServerErrorMessage = (
  error: unknown,
  fallback = 'An unexpected error occurred.'
): string => {
  if (!error) return fallback;
  const err = error as any;
  if (Array.isArray(err?.errors) && err.errors.length > 0 && typeof err.errors[0] === 'string') {
    return err.errors[0];
  }
  if (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.length > 0 && typeof err.response.data.errors[0] === 'string') {
    return err.response.data.errors[0];
  }
  return err?.response?.data?.message || err?.message || fallback;
};

/**
 * Maps raw server, network, and HTTP status codes to user-friendly, actionable feedback.
 * Prevents internal server information (SQL, Java stack traces, tokens) from being displayed.
 */
export const getActionableErrorMessage = (
  error: unknown,
  fallbackMessage = 'Unable to complete your request. Please try again.'
): string => {
  if (!error) return fallbackMessage;

  const err = error as StandardApiError & {
    response?: { status?: number; data?: any };
    message?: string;
    code?: string;
  };

  const statusCode =
    err?.statusCode ??
    err?.response?.status ??
    (typeof err?.data === 'object' && err?.data?.statusCode ? Number(err.data.statusCode) : undefined);

  const rawMessage =
    err?.response?.data?.message ||
    err?.message ||
    (Array.isArray(err?.errors) && err.errors[0]) ||
    '';

  // Check for network errors & timeouts first
  if (
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ERR_NETWORK' ||
    err?.code === 'ECONNREFUSED' ||
    rawMessage.includes('timeout') ||
    rawMessage.toLowerCase().includes('network error')
  ) {
    return "We couldn't connect to the server. Check your connection and try again.";
  }

  // Handle specific HTTP Status Codes
  switch (statusCode) {
    case 400: {
      if (rawMessage && !isInternalServerLeak(rawMessage)) {
        return rawMessage;
      }
      return fallbackMessage;
    }
    case 401: {
      if (rawMessage.toLowerCase().includes('credential') || rawMessage.toLowerCase().includes('password')) {
        return 'Incorrect email or password. Please verify and try again.';
      }
      return 'Your session has expired. Please log in again to continue.';
    }
    case 403: {
      return 'You do not have permission to perform this action.';
    }
    case 404: {
      if (rawMessage && !isInternalServerLeak(rawMessage)) {
        return rawMessage;
      }
      return 'The requested resource could not be found.';
    }
    case 408: {
      return 'The server took too long to respond. Please try again in a moment.';
    }
    case 409: {
      if (rawMessage.toLowerCase().includes('aishe')) {
        return 'An institution with this AISHE code already exists.';
      }
      if (rawMessage.toLowerCase().includes('email') || rawMessage.toLowerCase().includes('user')) {
        return 'An account with this email address already exists. Try logging in instead.';
      }
      if (rawMessage && !isInternalServerLeak(rawMessage)) {
        return rawMessage;
      }
      return 'A record with these details already exists.';
    }
    case 422: {
      return rawMessage || 'Some submitted information is invalid. Please review highlighted fields.';
    }
    case 429: {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    case 500:
    case 502:
    case 503:
    case 504: {
      return 'Our servers encountered an issue while processing your request. Please try again shortly.';
    }
    default: {
      if (rawMessage && !isInternalServerLeak(rawMessage)) {
        return rawMessage;
      }
      return fallbackMessage;
    }
  }
};

/**
 * Detects internal backend implementation leakage (SQL, Java exception traces, class names)
 */
export const isInternalServerLeak = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    /https?:\/\/[\w.-]+(?::\d+)?\/[\w./?=&%-]*/i.test(text) ||
    /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/.test(text) ||
    lower.includes('java.lang') ||
    lower.includes('org.springframework') ||
    lower.includes('hibernate') ||
    lower.includes('sqlexception') ||
    lower.includes('constraintviolation') ||
    lower.includes('internal server error') ||
    lower.includes('nullpointer') ||
    lower.includes('stacktrace') ||
    lower.includes('java backend') ||
    lower.includes('java database')
  );
};

/**
 * Maps backend field validation errors directly to react-hook-form fields
 */
export const mapServerErrorsToForm = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMapping?: Record<string, Path<T>>
): boolean => {
  if (!error) return false;

  const err = error as StandardApiError & { response?: { data?: any } };
  const rawErrors =
    err?.errors ||
    err?.response?.data?.errors ||
    (err as any)?.fieldErrors ||
    (err as any)?.response?.data?.fieldErrors ||
    (err as any)?.data?.errors;
  let hasMappedField = false;

  // Case 1: errors is an object { fieldName: "Error message" }
  if (rawErrors && typeof rawErrors === 'object' && !Array.isArray(rawErrors)) {
    Object.entries(rawErrors).forEach(([backendField, msg]) => {
      const targetField = fieldMapping?.[backendField] || (backendField as Path<T>);
      if (typeof msg === 'string') {
        setError(targetField, { type: 'server', message: msg });
        hasMappedField = true;
      }
    });
    return hasMappedField;
  }

  // Case 2: 409 Conflict with duplicate field hint
  const msg = getActionableErrorMessage(error);
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('aishe') && fieldMapping?.['aisheCode']) {
    setError(fieldMapping['aisheCode'], {
      type: 'server',
      message: 'This AISHE code is already in use by another institution.',
    });
    return true;
  }

  if ((lowerMsg.includes('email') || lowerMsg.includes('already exists')) && fieldMapping?.['email']) {
    setError(fieldMapping['email'], {
      type: 'server',
      message: 'An account with this email address already exists.',
    });
    return true;
  }

  return false;
};
