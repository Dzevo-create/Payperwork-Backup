"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { name?: string }
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        logger.info("User session restored", { userId: session.user.id });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (_event === "SIGNED_IN" && session?.user) {
        logger.info("User signed in", { userId: session.user.id });
      } else if (_event === "SIGNED_OUT") {
        logger.info("User signed out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("Sign in error", error, { email });
        return { error };
      }

      logger.info("User signed in successfully", { email });
      return { error: null };
    } catch (error) {
      logger.error("Unexpected sign in error", error as Error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        logger.error("Sign up error", error, { email });
        return { error };
      }

      logger.info("User signed up successfully", { email });
      return { error: null };
    } catch (error) {
      logger.error("Unexpected sign up error", error as Error);
      return { error: error as AuthError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error("Google sign in error", error);
        return { error };
      }

      logger.info("Google sign in initiated");
      return { error: null };
    } catch (error) {
      logger.error("Unexpected Google sign in error", error as Error);
      return { error: error as AuthError };
    }
  };

  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error("Apple sign in error", error);
        return { error };
      }

      logger.info("Apple sign in initiated");
      return { error: null };
    } catch (error) {
      logger.error("Unexpected Apple sign in error", error as Error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error("Sign out error", error);
        throw error;
      }

      logger.info("User signed out successfully");
    } catch (error) {
      logger.error("Unexpected sign out error", error as Error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error("Password reset error", error, { email });
        return { error };
      }

      logger.info("Password reset email sent", { email });
      return { error: null };
    } catch (error) {
      logger.error("Unexpected password reset error", error as Error);
      return { error: error as AuthError };
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
