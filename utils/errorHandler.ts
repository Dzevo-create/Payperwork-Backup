/**
 * Error Handler Utility
 * Provides user-friendly error messages for API errors
 */

interface ErrorMap {
  [key: string]: string;
}

// Common API error codes to user-friendly messages (German)
const ERROR_MESSAGES: ErrorMap = {
  // HTTP Status Codes
  '400': 'Ungültige Anfrage. Bitte überprüfe deine Eingabe.',
  '401': 'Nicht autorisiert. Bitte melde dich erneut an.',
  '403': 'Zugriff verweigert. Du hast keine Berechtigung für diese Aktion.',
  '404': 'Ressource nicht gefunden.',
  '429': 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.',
  '500': 'Serverfehler. Bitte versuche es später erneut.',
  '502': 'Gateway-Fehler. Der Service ist vorübergehend nicht erreichbar.',
  '503': 'Service nicht verfügbar. Bitte versuche es später erneut.',

  // Image Generation Specific Errors
  'NO_IMAGE_DATA': 'Bildgenerierung fehlgeschlagen. Wird automatisch wiederholt...',
  'IMAGE_URL_INVALID': 'Bildgenerierung fehlgeschlagen. Wird automatisch wiederholt...',
  'GENERATION_TIMEOUT': 'Bildgenerierung dauert zu lange. Wird automatisch wiederholt...',

  // Video Generation Specific Errors
  'NSFW_CONTENT': 'Der Prompt wurde abgelehnt. Bitte verwende familienfreundliche Begriffe.',
  'INVALID_IMAGE': 'Das Bild konnte nicht verarbeitet werden. Bitte verwende ein anderes Format (PNG, JPG).',
  'IMAGE_TOO_LARGE': 'Das Bild ist zu groß. Maximale Größe: 10MB.',
  'QUOTA_EXCEEDED': 'API-Limit erreicht. Bitte versuche es später erneut.',
  'TIMEOUT': 'Die Generierung dauert zu lange. Versuche es mit kürzerer Dauer oder einfacherem Prompt.',
  'INVALID_PROMPT': 'Der Prompt ist ungültig. Bitte verwende eine aussagekräftige Beschreibung.',
  'PROMPT_TOO_LONG': 'Der Prompt ist zu lang. Maximale Länge: 500 Zeichen.',
  'INVALID_DURATION': 'Ungültige Dauer ausgewählt.',
  'INVALID_ASPECT_RATIO': 'Ungültiges Seitenverhältnis ausgewählt.',
  'GENERATION_FAILED': 'Die Video-Generierung ist fehlgeschlagen. Bitte versuche es erneut.',
  'TASK_NOT_FOUND': 'Video-Aufgabe nicht gefunden. Möglicherweise ist sie abgelaufen.',

  // Network Errors
  'NETWORK_ERROR': 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.',
  'FETCH_FAILED': 'Anfrage fehlgeschlagen. Bitte versuche es erneut.',
};

/**
 * Get user-friendly error message from error code or API response
 */
export function getErrorMessage(error: any): string {
  // If error is a string, check if it's a known error code
  if (typeof error === 'string') {
    // Check for quota exceeded message
    if (error.toLowerCase().includes('quota') && error.toLowerCase().includes('exceeded')) {
      return ERROR_MESSAGES['QUOTA_EXCEEDED'] ?? 'Quota exceeded';
    }
    return ERROR_MESSAGES[error] || error;
  }

  // If error is an Error object
  if (error instanceof Error) {
    // Check if message contains known error codes
    const message = error.message;

    // Check for quota exceeded message
    if (message.toLowerCase().includes('quota') && message.toLowerCase().includes('exceeded')) {
      return ERROR_MESSAGES['QUOTA_EXCEEDED'] ?? 'Quota exceeded';
    }

    for (const [code, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(code)) {
        return friendlyMessage;
      }
    }
    return message;
  }

  // If error has a status code (HTTP response)
  if (error.status) {
    const statusCode = error.status.toString();
    return ERROR_MESSAGES[statusCode] || `Fehler ${statusCode}`;
  }

  // If error has an error field
  if (error.error) {
    return getErrorMessage(error.error);
  }

  // If error has a message field
  if (error.message) {
    return getErrorMessage(error.message);
  }

  // Default fallback
  return 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.';
}

/**
 * Handle API response and throw user-friendly error if not ok
 */
export async function handleApiResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch (e) {
      // JSON parsing failed, use status code
      throw new Error(getErrorMessage({ status: response.status }));
    }

    // Try to extract error message from response
    const errorMessage =
      errorData.error ||
      errorData.message ||
      errorData.details ||
      getErrorMessage({ status: response.status });

    throw new Error(getErrorMessage(errorMessage));
  }

  return response;
}

/**
 * Extract and format error for display
 */
export function formatErrorForDisplay(error: any): {
  title: string;
  message: string;
  retryable: boolean;
} {
  const message = getErrorMessage(error);

  // Determine if error is retryable
  const retryableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'QUOTA_EXCEEDED',
    '429',
    '500',
    '502',
    '503',
  ];

  const isRetryable = retryableErrors.some(code =>
    (typeof error === 'string' && error.includes(code)) ||
    (error?.message && error.message.includes(code))
  );

  return {
    title: isRetryable ? 'Vorübergehender Fehler' : 'Fehler',
    message,
    retryable: isRetryable,
  };
}
