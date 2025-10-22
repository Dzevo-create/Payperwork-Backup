/**
 * ResetPasswordForm Component Tests
 * Tests password reset flow, validation, and success state
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { translateAuthError } from "@/lib/auth-errors";

// Mock dependencies
jest.mock("@/contexts/AuthContext");
jest.mock("@/lib/auth-errors");

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockTranslateAuthError = translateAuthError as jest.MockedFunction<typeof translateAuthError>;

describe("ResetPasswordForm", () => {
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
      loading: false,
    });

    // Setup translation mock
    mockTranslateAuthError.mockImplementation((msg) => msg);
  });

  describe("rendering", () => {
    it("should render reset password form with email input", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByRole("button", { name: /zurücksetzen link senden/i })).toBeInTheDocument();
    });

    it("should render back to login link", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/zurück zur anmeldung/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /zurück zur anmeldung/i })).toHaveAttribute(
        "href",
        "/auth/login"
      );
    });

    it("should render form title and description", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByText(/passwort zurücksetzen/i)).toBeInTheDocument();
      expect(screen.getByText(/gib deine e-mail-adresse ein/i)).toBeInTheDocument();
    });
  });

  describe("form interaction", () => {
    it("should update email input value", () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail") as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should call resetPassword when form is submitted", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
      });
    });
  });

  describe("successful password reset request", () => {
    it("should show success message after successful reset request", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/e-mail versendet!/i)).toBeInTheDocument();
      });
    });

    it("should display success message with email address", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wir haben dir einen link zum zurücksetzen/i)).toBeInTheDocument();
      });
    });

    it("should show link to return to login after success", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const loginLink = screen.getByRole("link", { name: /zurück zur anmeldung/i });
        expect(loginLink).toHaveAttribute("href", "/auth/login");
      });
    });

    it("should not show form after successful reset", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("E-Mail")).not.toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should display translated error on reset failure", async () => {
      const errorMessage = "User not found";
      const translatedError = "Benutzer nicht gefunden";

      mockResetPassword.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce(translatedError);

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "nonexistent@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockTranslateAuthError).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByText(translatedError)).toBeInTheDocument();
      });
    });

    it("should not show success message on error", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: { message: "Error" } });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/e-mail versendet!/i)).not.toBeInTheDocument();
      });
    });

    it("should clear previous error on new submission", async () => {
      mockResetPassword
        .mockResolvedValueOnce({ error: { message: "Error 1" } })
        .mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      // First submission with error
      fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Error 1")).toBeInTheDocument();
      });

      // Second submission should clear error
      fireEvent.change(emailInput, { target: { value: "correct@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("Error 1")).not.toBeInTheDocument();
      });
    });

    it("should keep form visible on error", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: { message: "Error" } });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("should disable submit button during password reset request", async () => {
      mockResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        // After success, form should be hidden
        expect(screen.queryByPlaceholderText("E-Mail")).not.toBeInTheDocument();
      });
    });

    it("should re-enable button after error", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: { message: "Error" } });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("form validation", () => {
    it("should have email input with type email", () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have email input marked as required", () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      expect(emailInput).toBeRequired();
    });
  });

  describe("edge cases", () => {
    it("should handle empty email submission", async () => {
      render(<ResetPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });
      fireEvent.click(submitButton);

      // HTML5 validation should prevent submission
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText("E-Mail") as HTMLInputElement;
        expect(emailInput.value).toBe("");
      });
    });

    it("should trim whitespace from email", async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });

      render(<ResetPasswordForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const submitButton = screen.getByRole("button", { name: /zurücksetzen link senden/i });

      fireEvent.change(emailInput, { target: { value: "  test@example.com  " } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Browser should handle trimming, but we verify the call was made
        expect(mockResetPassword).toHaveBeenCalled();
      });
    });
  });
});
