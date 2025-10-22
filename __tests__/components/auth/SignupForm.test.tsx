/**
 * SignupForm Component Tests
 * Tests signup functionality, validation, error handling, and redirects
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignupForm } from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { translateAuthError } from "@/lib/auth-errors";

// Mock dependencies
jest.mock("@/contexts/AuthContext");
jest.mock("next/navigation");
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
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockTranslateAuthError = translateAuthError as jest.MockedFunction<typeof translateAuthError>;

describe("SignupForm", () => {
  const mockSignUp = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockSignInWithApple = jest.fn();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithApple: mockSignInWithApple,
      user: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      loading: false,
    });

    // Setup router mock
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
      route: "/",
      basePath: "",
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
    } as any);

    // Setup translation mock
    mockTranslateAuthError.mockImplementation((msg) => msg);
  });

  describe("rendering", () => {
    it("should render signup form with all input fields", () => {
      render(<SignupForm />);

      expect(screen.getByPlaceholderText("Vollständiger Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("E-Mail")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Passwort")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Passwort bestätigen")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<SignupForm />);

      expect(screen.getByRole("button", { name: /registrieren/i })).toBeInTheDocument();
    });

    it("should render OAuth buttons", () => {
      render(<SignupForm />);

      expect(screen.getByText(/mit google registrieren/i)).toBeInTheDocument();
      expect(screen.getByText(/mit apple registrieren/i)).toBeInTheDocument();
    });

    it("should render link to login page", () => {
      render(<SignupForm />);

      expect(screen.getByText(/bereits ein konto/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /jetzt anmelden/i })).toHaveAttribute(
        "href",
        "/auth/login"
      );
    });
  });

  describe("form interaction", () => {
    it("should update all input values", () => {
      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name") as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText("E-Mail") as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText("Passwort") as HTMLInputElement;
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen") as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });

      expect(nameInput.value).toBe("Test User");
      expect(emailInput.value).toBe("test@example.com");
      expect(passwordInput.value).toBe("password123");
      expect(confirmInput.value).toBe("password123");
    });
  });

  describe("form validation", () => {
    it("should show error when passwords do not match", async () => {
      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "different123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwörter stimmen nicht überein")).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should show error when password is too short", async () => {
      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "short" } });
      fireEvent.change(confirmInput, { target: { value: "short" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Passwort muss mindestens 8 Zeichen lang sein")
        ).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should accept password with exactly 8 characters", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "12345678" } });
      fireEvent.change(confirmInput, { target: { value: "12345678" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "12345678", {
          name: "Test User",
        });
      });
    });

    it("should clear previous validation errors on new submission", async () => {
      render(<SignupForm />);

      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      // First submission with mismatched passwords
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "different123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwörter stimmen nicht überein")).toBeInTheDocument();
      });

      // Second submission with matching passwords
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText("Passwörter stimmen nicht überein")).not.toBeInTheDocument();
      });
    });
  });

  describe("successful signup", () => {
    it("should call signUp with correct parameters", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123", {
          name: "Test User",
        });
      });
    });

    it("should redirect to /chat on successful signup", async () => {
      mockSignUp.mockResolvedValueOnce({ error: null });

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/chat");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("should display translated error on signup failure", async () => {
      const errorMessage = "User already registered";
      const translatedError = "Diese E-Mail-Adresse ist bereits registriert";

      mockSignUp.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce(translatedError);

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "existing@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockTranslateAuthError).toHaveBeenCalledWith(errorMessage);
        expect(screen.getByText(translatedError)).toBeInTheDocument();
      });
    });

    it("should not redirect on signup failure", async () => {
      mockSignUp.mockResolvedValueOnce({ error: { message: "Signup failed" } });

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
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

      render(<SignupForm />);

      const googleButton = screen.getByText(/mit google registrieren/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it("should call signInWithApple when Apple button is clicked", async () => {
      mockSignInWithApple.mockResolvedValueOnce({ error: null });

      render(<SignupForm />);

      const appleButton = screen.getByText(/mit apple registrieren/i);
      fireEvent.click(appleButton);

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });
    });

    it("should display error on Google OAuth failure", async () => {
      const errorMessage = "OAuth failed";
      mockSignInWithGoogle.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce("OAuth-Anmeldung fehlgeschlagen");

      render(<SignupForm />);

      const googleButton = screen.getByText(/mit google registrieren/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText("OAuth-Anmeldung fehlgeschlagen")).toBeInTheDocument();
      });
    });

    it("should display error on Apple OAuth failure", async () => {
      const errorMessage = "OAuth failed";
      mockSignInWithApple.mockResolvedValueOnce({ error: { message: errorMessage } });
      mockTranslateAuthError.mockReturnValueOnce("OAuth-Anmeldung fehlgeschlagen");

      render(<SignupForm />);

      const appleButton = screen.getByText(/mit apple registrieren/i);
      fireEvent.click(appleButton);

      await waitFor(() => {
        expect(screen.getByText("OAuth-Anmeldung fehlgeschlagen")).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("should disable submit button during signup", async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      render(<SignupForm />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name");
      const emailInput = screen.getByPlaceholderText("E-Mail");
      const passwordInput = screen.getByPlaceholderText("Passwort");
      const confirmInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /registrieren/i });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
