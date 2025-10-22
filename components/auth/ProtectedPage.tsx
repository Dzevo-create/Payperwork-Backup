"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedPageProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Protected Page Component
 *
 * Wraps pages that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedPage>
 *       <Dashboard />
 *     </ProtectedPage>
 *   );
 * }
 * ```
 */
export function ProtectedPage({ children, fallback }: ProtectedPageProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pw-accent border-t-transparent" />
            <p className="text-pw-black/60 mt-4 text-sm">Wird geladen...</p>
          </div>
        </div>
      )
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated, show content
  return <>{children}</>;
}
