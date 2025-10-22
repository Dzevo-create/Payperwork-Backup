"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { VideoBackground } from "./VideoBackground";
import { HeroShowcase } from "./HeroShowcase";
import { FeatureCards } from "./FeatureCards";
import { Navigation } from "./Navigation";

/**
 * Hero Component
 * Main landing page hero section with embedded navigation, video background, and CTA
 */

export function Hero() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleCTAClick = () => {
    if (user) {
      // User is logged in - go to chat
      router.push("/chat");
    } else {
      // User not logged in - go to signup
      router.push("/auth/signup");
    }
  };

  return (
    <section className="relative bg-pw-light pb-16">
      {/* Unified Hero Card with embedded Navigation */}
      <div className="relative w-full overflow-hidden rounded-b-3xl bg-pw-light shadow-2xl">
        {/* Navigation */}
        <Navigation />

        {/* Architecture Background Video */}
        <VideoBackground />

        {/* Gradient Blobs */}
        <div className="from-pw-accent/30 absolute left-10 top-20 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br to-transparent opacity-20 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-gradient-to-tl from-purple-500/20 to-transparent opacity-15 blur-3xl" />

        {/* Hero Content */}
        <div className="relative z-10 w-full px-8 py-32 pb-20 lg:px-16">
          <div className="max-w-none">
            <div className="grid items-start gap-16 lg:grid-cols-[1fr_auto]">
              {/* Left - Big Slogan, Description & CTA */}
              <div className="flex h-full flex-col">
                <h2 className="text-6xl font-light leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl xl:text-9xl">
                  Denken Sie in
                  <br />
                  <span className="font-normal text-pw-accent">Bildern</span>
                </h2>

                <div className="mt-auto space-y-4 pt-4">
                  <p className="max-w-3xl text-xl leading-relaxed text-white/50 lg:text-2xl">
                    KI-gestützte Visualisierung für kreative Profis. Transformieren Sie Ihre Ideen
                    in atemberaubende Realität – automatisch, präzise, revolutionär.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleCTAClick}
                      disabled={isLoading}
                      className="group rounded-full bg-white px-8 py-3 text-base font-semibold text-pw-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? "Lädt..." : user ? "Zum Chat" : "Jetzt kreieren"}
                    </button>
                    <Link href="#workflows">
                      <button className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10">
                        Workflows ansehen
                      </button>
                    </Link>
                  </div>

                  {/* Social Proof - subtle trust indicator */}
                  <div className="flex flex-wrap items-center gap-6 text-xs text-white/30">
                    <div className="flex items-center gap-2">
                      <div className="bg-pw-accent/50 h-1.5 w-1.5 rounded-full" />
                      <span>500+ Projekte</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="text-pw-accent/50 h-3.5 w-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>4.9/5 Rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Video Showcase */}
              <HeroShowcase />
            </div>

            {/* Feature Cards Below - Full Width */}
            <FeatureCards />
          </div>
        </div>
      </div>
    </section>
  );
}
