/**
 * Translate Supabase auth error messages to German
 */
export function translateAuthError(errorMessage: string): string {
  // Handle null/undefined
  if (!errorMessage) {
    return errorMessage;
  }

  const errorMap: Record<string, string> = {
    // Email/Password errors
    "Invalid login credentials": "Ungültige Anmeldedaten",
    "Email not confirmed": "E-Mail noch nicht bestätigt. Bitte überprüfe dein Postfach.",
    "User already registered": "Diese E-Mail-Adresse ist bereits registriert",
    "Password should be at least 6 characters": "Passwort muss mindestens 6 Zeichen lang sein",
    "Unable to validate email address: invalid format": "Ungültiges E-Mail-Format",
    "Email rate limit exceeded": "Zu viele Versuche. Bitte warte einen Moment.",
    "Invalid email or password": "Ungültige E-Mail oder Passwort",

    // OAuth errors
    "OAuth failed": "OAuth-Anmeldung fehlgeschlagen",
    oauth_failed: "OAuth-Anmeldung fehlgeschlagen. Bitte versuche es erneut.",

    // Session errors
    "Invalid Refresh Token": "Sitzung abgelaufen. Bitte melde dich erneut an.",
    refresh_token_not_found: "Sitzung abgelaufen. Bitte melde dich erneut an.",

    // Network errors
    "Failed to fetch": "Netzwerkfehler. Bitte überprüfe deine Internetverbindung.",
    "Network request failed": "Netzwerkfehler. Bitte versuche es erneut.",

    // Password reset
    "For security purposes, you can only request this once every 60 seconds":
      "Aus Sicherheitsgründen kannst du dies nur einmal pro Minute anfordern.",

    // Generic
    "An error occurred": "Ein Fehler ist aufgetreten",
    "Something went wrong": "Etwas ist schiefgelaufen",
  };

  // Check for exact match
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return original message if no translation found
  return errorMessage;
}
