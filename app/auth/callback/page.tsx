"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            logger.error("OAuth callback error", error);
            router.push("/auth/login?error=oauth_failed");
            return;
          }

          logger.info("OAuth sign in successful");
          router.push("/chat");
        } else {
          logger.warn("No code in OAuth callback");
          router.push("/auth/login");
        }
      } catch (error) {
        logger.error("Unexpected OAuth callback error", error as Error);
        router.push("/auth/login?error=oauth_failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="from-pw-accent/10 to-pw-accent/5 flex min-h-screen items-center justify-center bg-gradient-to-br px-4">
      <div className="text-center">
        <div className="border-pw-accent/20 mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-pw-accent"></div>
        <p className="text-pw-black/60 text-sm">Authentifizierung läuft...</p>
      </div>
    </div>
  );
}
