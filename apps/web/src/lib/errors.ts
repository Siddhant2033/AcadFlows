import { AxiosError } from 'axios';

/**
 * Extract a user-friendly error message from any error shape.
 * Handles:
 *   - Axios errors with backend `error` string
 *   - Axios errors with backend `error` array (old Zod shape)
 *   - Axios errors with `details` array
 *   - Zod errors from client-side validation
 *   - Plain Error objects
 *   - Network errors
 */
export function getErrorMessage(error: unknown): string {
  // Axios error with a response
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      // Backend returns { error: "..." }
      if (typeof body.error === 'string' && body.error.length > 0) {
        return body.error;
      }

      // Backend returns { error: [...zod issues...] } (legacy shape)
      if (Array.isArray(body.error)) {
        return formatZodIssues(body.error);
      }

      // Backend returns { details: [{field, message}] }
      if (Array.isArray(body.details) && body.details.length > 0) {
        return formatDetails(body.details);
      }

      // Backend returns { message: "..." }
      if (typeof body.message === 'string' && body.message.length > 0) {
        return body.message;
      }
    }

    // No response body — use HTTP status text
    if (error.response?.status) {
      return httpStatusMessage(error.response.status);
    }

    // Network error
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Please check your connection.';
    }

    if (error.message) {
      return error.message;
    }
  }

  // Plain Error
  if (error instanceof Error) {
    return error.message || 'Something went wrong';
  }

  // Fallback
  return 'Something went wrong. Please try again.';
}

/* ──────────────── helpers ──────────────── */

function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as AxiosError)?.isAxiosError;
}

function formatZodIssues(issues: any[]): string {
  if (issues.length === 1) {
    const issue = issues[0];
    const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
    return path ? `${path}: ${issue.message}` : issue.message;
  }
  const first = issues.slice(0, 3).map(issue => {
    const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  const extra = issues.length > 3 ? ` (and ${issues.length - 3} more)` : '';
  return first.join('; ') + extra;
}

function formatDetails(details: any[]): string {
  if (details.length === 1) {
    const d = details[0];
    return d.field ? `${d.field}: ${d.message}` : d.message;
  }
  const first = details.slice(0, 3).map(d =>
    d.field ? `${d.field}: ${d.message}` : d.message,
  );
  const extra = details.length > 3 ? ` (and ${details.length - 3} more)` : '';
  return first.join('; ') + extra;
}

function httpStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your inputs.',
    401: 'Your session has expired. Please log in again.',
    403: "You don't have permission to do that.",
    404: 'The requested resource was not found.',
    409: 'A record with these details already exists.',
    422: 'Some fields need attention.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Something went wrong on our end. Please try again.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
  };
  return messages[status] || 'Something went wrong. Please try again.';
}