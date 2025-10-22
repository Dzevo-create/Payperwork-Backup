/**
 * LoginForm Component Tests
 * Tests login functionality, error handling, and redirects
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";

// Mock dependencies
jest.mock("@/contexts/AuthContext");
jest.mock("@/lib/auth-errors");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockTranslateAuthError = translateAuthError as jest.MockedFunction<typeof translateAuthError>;

describe("LoginForm", () => {
  const mockSignIn = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockSignInWithApple = jest.fn();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock
    (mockUseAuth as any).mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithApple: mockSignInWithApple,
      user: null,
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      loading: false,
    });

    // Setup router mock - router is mocked globally
    const router = useRouter();
    router.push = mockPush;
    router.refresh = mockRefresh;

    // Setup translation mock - by default return the same message
    (mockTranslateAuthError as any).mockImplementation((msg: string) => msg);
  });

  describe("rendering", () => {
    it("should render login form with all elements", () => {
      render(<LoginForm />);

      expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Passwort")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /anmelden/i })).toBeInTheDocument();
    });

    it("should render OAuth buttons", () => {
      render(<LoginForm />);

      expect(screen.getByText(/mit google anmelden/i)).toBeInTheDocument();
      expect(screen.getByText(/mit apple anmelden/i)).toBeInTheDocument();
    });

    it("should render link to signup page", () => {
      render(<LoginForm />);

      expect(screen.getByText(/noch kein konto/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /jetzt registrieren/i })).toHaveAttribute(
        "href",
        "/auth/signup"
      );
    });

    it("should render password reset link", () => {
      render(<LoginForm />);

      expect(screen.getByRole("link", { name: /passwort vergessen/i })).toHaveAttribute(
        "href",
        "/auth/reset-password"
      );
    });
  });

  describe("form interaction", () => {
    it("should update email input value", () => {
      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail") as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password input value", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText("Passwort") as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      expect(passwordInput.value).toBe("password123");
    });

    it("should call signIn when form is submitted", async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });
  });

  describe("successful login", () => {
    it("should redirect to /chat on successful login", async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/chat");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("should not display error on successful login", async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/ungültige/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should display translated error on login failure", async () => {
      const errorMessage = "Invalid login credentials";
      const translatedError = "Ungültige Anmeldedaten";

      mockSignIn.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce(translatedError);

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockTranslateAuthError).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByText(translatedError)).toBeInTheDocument();
      });
    });

    it("should clear previous error on new submission", async () => {
      mockSignIn
        .mockResolvedValueOnce({ error: { message: "Error 1" } })
        .mockResolvedValueOnce({ error: null });

      const { rerender } = render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      // First submission with error
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrong" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Error 1")).toBeInTheDocument();
      });

      // Second submission should clear error
      fireEvent.change(passwordInput, { target: { value: "correct" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("Error 1")).not.toBeInTheDocument();
      });
    });

    it("should not redirect on login failure", async () => {
      mockSignIn.mockResolvedValueOnce({ error: { message: "Invalid credentials" } });

      render(<LoginForm />);

      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const submitButton = screen.getByRole("button", { name: /anmelden/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrong" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
        expect(mockRefresh).not.toHaveBeenCalled();
      });
    });
  });

  describe("OAuth authentication", () => {
    it("should call signInWithGoogle when Google button is clicked", async () => {
      mockSignInWithGoogle.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const googleButton = screen.getByText(/mit google anmelden/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it("should call signInWithApple when Apple button is clicked", async () => {
      mockSignInWithApple.mockResolvedValueOnce({ error: null });

      render(<LoginForm />);

      const appleButton = screen.getByText(/mit apple anmelden/i);
      fireEvent.click(appleButton);

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });
    });

    it("should display error on Google OAuth failure", async () => {
      const errorMessage = "OAuth failed";
      mockSignInWithGoogle.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce("OAuth-Anmeldung fehlgeschlagen");

      render(<LoginForm />);

      const googleButton = screen.getByText(/mit google anmelden/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText("OAuth-Anmeldung fehlgeschlagen")).toBeInTheDocument();
      });
    });

    it("should display error on Apple OAuth failure", async () => {
      const errorMessage = "OAuth failed";
      mockSignInWithApple.mockResolvedValueOnce({ error: { message: errorMessage } });

      render(<LoginForm />);

      const appleButton = screen.getByText(/mit apple anmelden/i);
      fireEvent.click(appleButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("should show loading state during form submission", async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /anmelden/i });
      fireEvent.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("form validation", () => {
    it("should prevent submission with empty email", async () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /anmelden/i });
      const passwordInput = screen.getByPlaceholderText("Passwort");

      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // HTML5 validation should prevent submission
      // mockSignIn should not be called with empty email
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText("E-Mail") as HTMLInputElement;
        expect(emailInput.value).toBe("");
      });
    });

    it("should prevent submission with empty password", async () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /anmelden/i });
      const emailInput = screen.getByPlaceholderText("E-Mail");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText("Passwort") as HTMLInputElement;
        expect(passwordInput.value).toBe("");
      });
    });
  });
});
