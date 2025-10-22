"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import Image from "next/image";

export function SignupForm() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, { name });

    if (error) {
      setError(translateAuthError(error.message));
      setIsLoading(false);
    } else {
      // Redirect directly to chat
      router.push("/chat");
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(translateAuthError(error.message));
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setIsAppleLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      setError(translateAuthError(error.message));
      setIsAppleLoading(false);
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

        {/* Right Side - Success Message */}
        <div className="flex w-full items-center justify-center px-4 py-1 lg:w-1/2">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-pw-black">
              Erfolgreich registriert!
            </h2>
            <p className="text-pw-black/60 mt-2 text-sm">
              Bitte überprüfe deine E-Mails, um dein Konto zu bestätigen.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="hover:bg-pw-accent/90 mt-6 w-full rounded-xl bg-pw-accent px-4 py-3 text-sm font-medium text-pw-black transition-all hover:scale-[1.02]"
            >
              Zur Anmeldung
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Left Side - Image Card with Overlay Text */}
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

      {/* Right Side - Signup Form */}
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
            <h1 className="text-3xl font-bold tracking-tight text-pw-black">Konto erstellen</h1>
            <p className="text-pw-black/60 mt-2 text-sm">Registriere dich kostenlos</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Social Signup Buttons */}
          <div className="mb-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="border-pw-black/10 hover:bg-pw-black/5 flex w-full items-center justify-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-pw-black transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <div className="border-pw-black/20 h-5 w-5 animate-spin rounded-full border-2 border-t-pw-black"></div>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Mit Google registrieren
            </button>
          </div>

          {/* Divider */}
          <div className="my-3 text-center">
            <span className="text-pw-black/60 text-sm">Oder mit E-Mail</span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-pw-black">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-pw-black">
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-pw-black">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                placeholder="••••••••"
              />
              <p className="text-pw-black/60 mt-1 text-xs">Mindestens 8 Zeichen</p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-pw-black"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-pw-black/10 placeholder-pw-black/40 focus:ring-pw-accent/20 w-full rounded-xl border bg-white px-4 py-3 text-sm text-pw-black transition-all focus:border-pw-accent focus:outline-none focus:ring-2"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="hover:bg-pw-black/90 w-full rounded-xl bg-pw-black px-4 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Wird registriert..." : "Konto erstellen"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-pw-black/80 mt-3 text-center text-sm">
            Bereits ein Konto?{" "}
            <Link
              href="/auth/login"
              className="hover:text-pw-black/70 font-medium text-pw-black underline transition-colors"
            >
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
