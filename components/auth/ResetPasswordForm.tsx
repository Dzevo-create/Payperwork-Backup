"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import Image from "next/image";

export function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(translateAuthError(error.message));
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Left Side - Image Card */}
        <div className="hidden items-center justify-center px-2 py-1 lg:flex lg:w-1/2">
          <div className="relative h-[98vh] w-full overflow-hidden rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
            <Image
              src="/images/Pictures/Fotos/ahmed-ununfDqAXJA-unsplash.jpg"
              alt="Payperwork"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute left-6 top-6">
              <Link href="/">
                <Image
                  src="/images/Logo/logo-black.png"
                  alt="Payperwork"
                  width={160}
                  height={45}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-8 text-center">
                <h2 className="text-2xl font-normal text-pw-black">Deine Arbeit. Dein Wert.</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="flex w-full items-center justify-center px-4 py-1 lg:w-1/2">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-pw-black">E-Mail versendet!</h2>
            <p className="text-pw-black/60 mt-2 text-sm">
              Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts geschickt.
            </p>
            <p className="text-pw-black/40 mt-4 text-xs">
              Überprüfe auch deinen Spam-Ordner, falls du die E-Mail nicht findest.
            </p>
            <Link
              href="/auth/login"
              className="hover:text-pw-black/70 mt-6 inline-block text-sm text-pw-black underline"
            >
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Left Side - Image Card */}
      <div className="hidden items-center justify-center px-2 py-1 lg:flex lg:w-1/2">
        <div className="relative h-[98vh] w-full overflow-hidden rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
          <Image
            src="/images/Pictures/Fotos/ahmed-ununfDqAXJA-unsplash.jpg"
            alt="Payperwork"
            fill
            className="object-cover"
            priority
            unoptimized
          />

          {/* Logo Top Left */}
          <div className="absolute left-6 top-6">
            <Link href="/">
              <Image
                src="/images/Logo/logo-black.png"
                alt="Payperwork"
                width={160}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Motivational Text Bottom */}
          <div className="absolute bottom-8 left-6 right-6 space-y-2">
            <h2 className="text-xl font-normal leading-relaxed text-white">
              Verwandle deine Ideen in Wirklichkeit,
              <br />
              Schritt für Schritt.
            </h2>
            <p className="text-sm text-white/90">Arbeite effizienter mit intelligenten Tools.</p>
            <p className="text-xs text-white/70">
              Payperwork — Wo Kreativität auf Produktivität trifft.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex w-full items-center justify-center px-4 py-1 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-4 text-center lg:hidden">
            <Link href="/" className="inline-block">
              <Image
                src="/images/Logo/logo-black.png"
                alt="Payperwork"
                width={160}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-pw-black">
              Passwort zurücksetzen
            </h1>
            <p className="text-pw-black/60 mt-2 text-sm">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-pw-black">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                placeholder="deine@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="hover:bg-pw-black/90 w-full rounded-xl bg-pw-black px-4 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Link wird gesendet..." : "Zurücksetzen-Link senden"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-pw-black/80 mt-3 text-center text-sm">
            Zurück zum{" "}
            <Link
              href="/auth/login"
              className="hover:text-pw-black/70 font-medium text-pw-black underline transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
