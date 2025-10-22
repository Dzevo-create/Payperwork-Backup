/**
 * ProfilePage Component Tests
 * Tests profile updates for name and password
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Mock dependencies
jest.mock("@/contexts/AuthContext");
jest.mock("next/navigation");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
    },
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUpdateUser = supabase.auth.updateUser as jest.MockedFunction<
  typeof supabase.auth.updateUser
>;

describe("ProfilePage", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
    user_metadata: {
      name: "Test User",
    },
    created_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    aud: "authenticated",
    created: "2024-01-01T00:00:00Z",
  };

  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup auth context mock
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
      resetPassword: jest.fn(),
      loading: false,
    });

    // Setup router mock
    mockUseRouter.mockReturnValue({
      back: mockBack,
      push: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
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
  });

  describe("rendering", () => {
    it("should render profile page with user information", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Profil")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("should render back button", () => {
      render(<ProfilePage />);

      const backButton = screen.getByRole("button", { name: /zurück/i });
      expect(backButton).toBeInTheDocument();
    });

    it("should call router.back when back button is clicked", () => {
      render(<ProfilePage />);

      const backButton = screen.getByRole("button", { name: /zurück/i });
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it("should render name update form", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Name ändern")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    it("should render password update form", () => {
      render(<ProfilePage />);

      expect(screen.getByText("Passwort ändern")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Neues Passwort")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Passwort bestätigen")).toBeInTheDocument();
    });

    it("should display member since date", () => {
      render(<ProfilePage />);

      expect(screen.getByText(/mitglied seit/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Januar 2024/i)).toBeInTheDocument();
    });
  });

  describe("name update", () => {
    it("should update name input value", () => {
      render(<ProfilePage />);

      const nameInput = screen.getByDisplayValue("Test User") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "New Name" } });

      expect(nameInput.value).toBe("New Name");
    });

    it("should call updateUser with new name on form submission", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const nameInput = screen.getByDisplayValue("Test User");
      const submitButton = screen.getByRole("button", { name: /name aktualisieren/i });

      fireEvent.change(nameInput, { target: { value: "New Name" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          data: { name: "New Name" },
        });
      });
    });

    it("should show success message after successful name update", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const nameInput = screen.getByDisplayValue("Test User");
      const submitButton = screen.getByRole("button", { name: /name aktualisieren/i });

      fireEvent.change(nameInput, { target: { value: "New Name" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name erfolgreich aktualisiert/i)).toBeInTheDocument();
      });
    });

    it("should show error message on name update failure", async () => {
      const errorMessage = "Update failed";
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: errorMessage } as any,
      });

      render(<ProfilePage />);

      const nameInput = screen.getByDisplayValue("Test User");
      const submitButton = screen.getByRole("button", { name: /name aktualisieren/i });

      fireEvent.change(nameInput, { target: { value: "New Name" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should clear error on new submission", async () => {
      mockUpdateUser
        .mockResolvedValueOnce({
          data: { user: null },
          error: { message: "Error 1" } as any,
        })
        .mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const nameInput = screen.getByDisplayValue("Test User");
      const submitButton = screen.getByRole("button", { name: /name aktualisieren/i });

      // First submission with error
      fireEvent.change(nameInput, { target: { value: "Name 1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Error 1")).toBeInTheDocument();
      });

      // Second submission should clear error
      fireEvent.change(nameInput, { target: { value: "Name 2" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("Error 1")).not.toBeInTheDocument();
      });
    });

    it("should disable submit button during update", async () => {
      mockUpdateUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: mockUser }, error: null }), 100)
          )
      );

      render(<ProfilePage />);

      const submitButton = screen.getByRole("button", { name: /name aktualisieren/i });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("password update", () => {
    it("should update password input values", () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort") as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        "Passwort bestätigen"
      ) as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });

      expect(newPasswordInput.value).toBe("newpassword123");
      expect(confirmPasswordInput.value).toBe("newpassword123");
    });

    it("should validate password length", async () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "short" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "short" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Passwort muss mindestens 8 Zeichen lang sein")
        ).toBeInTheDocument();
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("should validate password confirmation match", async () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "password123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "different123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Passwörter stimmen nicht überein")).toBeInTheDocument();
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("should call updateUser with new password on form submission", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: "newpassword123",
        });
      });
    });

    it("should show success message after successful password update", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwort erfolgreich aktualisiert/i)).toBeInTheDocument();
      });
    });

    it("should clear password fields after successful update", async () => {
      mockUpdateUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort") as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        "Passwort bestätigen"
      ) as HTMLInputElement;
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(newPasswordInput.value).toBe("");
        expect(confirmPasswordInput.value).toBe("");
      });
    });

    it("should show error message on password update failure", async () => {
      const errorMessage = "Password update failed";
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: errorMessage } as any,
      });

      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should disable submit button during password update", async () => {
      mockUpdateUser.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: mockUser }, error: null }), 100)
          )
      );

      render(<ProfilePage />);

      const newPasswordInput = screen.getByPlaceholderText("Neues Passwort");
      const confirmPasswordInput = screen.getByPlaceholderText("Passwort bestätigen");
      const submitButton = screen.getByRole("button", { name: /passwort aktualisieren/i });

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("edge cases", () => {
    it("should handle user without metadata gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, user_metadata: {} },
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        resetPassword: jest.fn(),
        loading: false,
      });

      render(<ProfilePage />);

      const nameInput = screen.getByPlaceholderText("Vollständiger Name") as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });

    it("should handle null user gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        resetPassword: jest.fn(),
        loading: false,
      });

      render(<ProfilePage />);

      // Should still render without crashing
      expect(screen.getByText("Profil")).toBeInTheDocument();
    });

    it("should handle missing created_at date", () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, created_at: undefined } as any,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        resetPassword: jest.fn(),
        loading: false,
      });

      render(<ProfilePage />);

      expect(screen.getByText("Unbekannt")).toBeInTheDocument();
    });
  });
});
