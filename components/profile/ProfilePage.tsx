"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);
    setIsUpdatingName(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) {
        setNameError(error.message);
      } else {
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch (error) {
      setNameError("Ein Fehler ist aufgetreten");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (error) {
      setPasswordError("Ein Fehler ist aufgetreten");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-pw-black/60 mb-4 flex items-center gap-2 text-sm transition-colors hover:text-pw-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <h1 className="text-4xl font-bold text-pw-black">Profil</h1>
          <p className="text-pw-black/60 mt-2">Verwalte deine Kontoinformationen</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Info Card */}
          <div className="border-pw-black/10 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pw-accent">
                <User className="h-6 w-6 text-pw-black" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-pw-black">Account</h2>
                <p className="text-pw-black/60 text-sm">Deine Kontoinformationen</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-pw-black/60 text-xs font-medium uppercase tracking-wide">
                  E-Mail
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="text-pw-black/40 h-4 w-4" />
                  <p className="text-sm text-pw-black">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="text-pw-black/60 text-xs font-medium uppercase tracking-wide">
                  Mitglied seit
                </label>
                <p className="mt-1 text-sm text-pw-black">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unbekannt"}
                </p>
              </div>
            </div>
          </div>

          {/* Update Name Card */}
          <div className="border-pw-black/10 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-pw-black">Name ändern</h2>

            {nameSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Name erfolgreich aktualisiert!
              </div>
            )}

            {nameError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {nameError}
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-pw-black">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                  placeholder="Dein Name"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingName || !name}
                className="hover:bg-pw-black/90 w-full rounded-xl bg-pw-black px-4 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingName ? "Speichert..." : "Name speichern"}
              </button>
            </form>
          </div>

          {/* Update Password Card */}
          <div className="border-pw-black/10 rounded-2xl border bg-white p-6 shadow-sm md:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-pw-black/5 flex h-10 w-10 items-center justify-center rounded-full">
                <Lock className="text-pw-black/60 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-pw-black">Passwort ändern</h2>
                <p className="text-pw-black/60 text-sm">Aktualisiere dein Passwort</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Passwort erfolgreich aktualisiert!
              </div>
            )}

            {passwordError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-pw-black"
                  >
                    Neues Passwort
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-pw-black"
                  >
                    Passwort bestätigen
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                className="hover:bg-pw-black/90 w-full rounded-xl bg-pw-black px-8 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isUpdatingPassword ? "Aktualisiert..." : "Passwort aktualisieren"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
