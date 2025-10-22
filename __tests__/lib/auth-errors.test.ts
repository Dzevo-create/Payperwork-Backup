/**
 * Auth Error Translation Tests
 * Tests the translateAuthError function for proper German translations
 */

import { describe, it, expect } from "@jest/globals";
import { translateAuthError } from "@/lib/auth-errors";

describe("translateAuthError", () => {
  describe("exact matches", () => {
    it('should translate "Invalid login credentials"', () => {
      expect(translateAuthError("Invalid login credentials")).toBe("Ungültige Anmeldedaten");
    });

    it('should translate "Email not confirmed"', () => {
      expect(translateAuthError("Email not confirmed")).toBe(
        "E-Mail noch nicht bestätigt. Bitte überprüfe dein Postfach."
      );
    });

    it('should translate "User already registered"', () => {
      expect(translateAuthError("User already registered")).toBe(
        "Diese E-Mail-Adresse ist bereits registriert"
      );
    });

    it('should translate "Password should be at least 6 characters"', () => {
      expect(translateAuthError("Password should be at least 6 characters")).toBe(
        "Passwort muss mindestens 6 Zeichen lang sein"
      );
    });

    it('should translate "Unable to validate email address: invalid format"', () => {
      expect(translateAuthError("Unable to validate email address: invalid format")).toBe(
        "Ungültiges E-Mail-Format"
      );
    });

    it('should translate "Email rate limit exceeded"', () => {
      expect(translateAuthError("Email rate limit exceeded")).toBe(
        "Zu viele Versuche. Bitte warte einen Moment."
      );
    });

    it('should translate "Invalid email or password"', () => {
      expect(translateAuthError("Invalid email or password")).toBe(
        "Ungültige E-Mail oder Passwort"
      );
    });

    it('should translate "OAuth failed"', () => {
      expect(translateAuthError("OAuth failed")).toBe("OAuth-Anmeldung fehlgeschlagen");
    });
  });

  describe("partial matches", () => {
    it("should match error messages containing keywords (case insensitive)", () => {
      expect(translateAuthError("Error: Invalid login credentials occurred")).toBe(
        "Ungültige Anmeldedaten"
      );

      expect(translateAuthError("INVALID LOGIN CREDENTIALS")).toBe("Ungültige Anmeldedaten");
    });

    it("should match password-related errors", () => {
      expect(translateAuthError("password should be at least 6 characters long")).toBe(
        "Passwort muss mindestens 6 Zeichen lang sein"
      );
    });

    it("should match email format errors", () => {
      expect(translateAuthError("Unable to validate email address: INVALID FORMAT")).toBe(
        "Ungültiges E-Mail-Format"
      );
    });
  });

  describe("unknown errors", () => {
    it("should return original message for unknown errors", () => {
      const unknownError = "This is an unknown error message";
      expect(translateAuthError(unknownError)).toBe(unknownError);
    });

    it("should return original message for empty string", () => {
      expect(translateAuthError("")).toBe("");
    });

    it("should handle special characters in error messages", () => {
      // Note: "Something went wrong" is intentionally translated
      const specialError = "Error: Something went wrong! @#$%";
      expect(translateAuthError(specialError)).toBe("Etwas ist schiefgelaufen");
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined gracefully", () => {
      // TypeScript won't allow this, but test runtime behavior
      expect(translateAuthError(null as any)).toBe(null as any);
      expect(translateAuthError(undefined as any)).toBe(undefined as any);
    });

    it("should handle very long error messages", () => {
      const longError = "A".repeat(1000);
      expect(translateAuthError(longError)).toBe(longError);
    });

    it("should handle error messages with newlines", () => {
      const errorWithNewline = "Invalid login credentials\nPlease try again";
      // Should still match the first part
      expect(translateAuthError(errorWithNewline)).toBe("Ungültige Anmeldedaten");
    });
  });

  describe("real-world Supabase errors", () => {
    it("should translate signup with existing email", () => {
      expect(translateAuthError("User already registered")).toBe(
        "Diese E-Mail-Adresse ist bereits registriert"
      );
    });

    it("should translate weak password error", () => {
      expect(translateAuthError("Password should be at least 6 characters")).toBe(
        "Passwort muss mindestens 6 Zeichen lang sein"
      );
    });

    it("should translate unverified email error", () => {
      expect(translateAuthError("Email not confirmed")).toBe(
        "E-Mail noch nicht bestätigt. Bitte überprüfe dein Postfach."
      );
    });

    it("should translate rate limiting error", () => {
      expect(translateAuthError("Email rate limit exceeded")).toBe(
        "Zu viele Versuche. Bitte warte einen Moment."
      );
    });
  });

  describe("case sensitivity", () => {
    it("should be case insensitive for partial matches", () => {
      expect(translateAuthError("INVALID LOGIN CREDENTIALS")).toBe("Ungültige Anmeldedaten");

      expect(translateAuthError("invalid login credentials")).toBe("Ungültige Anmeldedaten");

      expect(translateAuthError("Invalid Login Credentials")).toBe("Ungültige Anmeldedaten");
    });
  });
});
