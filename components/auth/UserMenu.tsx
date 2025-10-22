"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Show nothing while loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-pw-black/10 h-8 w-8 animate-pulse rounded-full" />
      </div>
    );
  }

  // Show login button if not authenticated
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.push("/auth/login")} className="text-sm">
          Anmelden
        </Button>
        <Button onClick={() => router.push("/auth/signup")} className="text-sm">
          Registrieren
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : "U";

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="hover:bg-pw-black/5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-pw-black transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pw-accent text-sm font-semibold text-white">
          {userInitials}
        </div>
        <span className="hidden sm:inline">{user.name || user.email}</span>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

          {/* Dropdown menu */}
          <div className="border-pw-black/10 absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-white shadow-lg">
            <div className="border-pw-black/10 border-b px-4 py-3">
              <p className="text-sm font-medium text-pw-black">{user.name || "User"}</p>
              <p className="text-pw-black/60 text-xs">{user.email}</p>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // TODO: Navigate to profile settings
                }}
                className="hover:bg-pw-black/5 flex w-full items-center gap-3 px-4 py-2 text-sm text-pw-black transition-colors"
              >
                <User className="h-4 w-4" />
                Profil
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // TODO: Navigate to settings
                }}
                className="hover:bg-pw-black/5 flex w-full items-center gap-3 px-4 py-2 text-sm text-pw-black transition-colors"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </button>
            </div>

            <div className="border-pw-black/10 border-t py-2">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Wird abgemeldet..." : "Abmelden"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
