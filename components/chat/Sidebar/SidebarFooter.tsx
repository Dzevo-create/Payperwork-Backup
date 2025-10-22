"use client";

import Link from "next/link";
import { Settings, User, LogOut, Moon, Bell, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SidebarFooterProps {
  credits?: number;
}

export function SidebarFooter({ credits = 3000 }: SidebarFooterProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2">
        {/* Home Button */}
        <Link
          href="/"
          className="hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg p-2 transition-all duration-200 hover:scale-110"
          aria-label="Home"
          title="Zur Startseite"
        >
          <Home className="text-pw-black/60 h-4 w-4" />
        </Link>

        {/* Profile Dropdown */}
        <div className="relative flex-1" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="hover:bg-pw-black/20 active:bg-pw-black/30 flex w-full items-center gap-2 rounded-lg p-2 transition-all duration-200"
            aria-label="Profile"
          >
            <User className="text-pw-black/60 h-4 w-4" />
            <span className="text-pw-black/80 flex-1 text-left text-xs font-medium">Profil</span>
          </button>

          {showProfileMenu && (
            <div className="border-pw-black/10 absolute bottom-full left-0 z-50 mb-2 w-52 rounded-xl border bg-white py-2 shadow-2xl">
              <div className="border-pw-black/10 border-b px-4 py-2">
                <p className="text-sm font-semibold text-pw-black">
                  {user?.user_metadata?.name || "Benutzer"}
                </p>
                <p className="text-pw-black/60 truncate text-xs" title={user?.email}>
                  {user?.email || "Keine E-Mail"}
                </p>
              </div>
              {/* Credits in Dropdown */}
              <div className="border-pw-black/10 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-pw-black/60 text-xs">Credits</span>
                  <span className="text-sm font-bold text-pw-accent">{credits}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push("/profile");
                }}
                className="text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-all duration-150"
              >
                <User className="h-4 w-4" />
                <span>Profil bearbeiten</span>
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 transition-all duration-150 hover:bg-red-100 active:bg-red-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg p-2 transition-all duration-200 hover:scale-110"
            aria-label="Settings"
          >
            <Settings className="text-pw-black/60 h-4 w-4" />
          </button>

          {showSettingsMenu && (
            <div className="border-pw-black/10 absolute bottom-full right-0 z-50 mb-2 w-48 rounded-xl border bg-white py-2 shadow-2xl">
              <button className="text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-all duration-150">
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </button>
              <button className="text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-all duration-150">
                <Bell className="h-4 w-4" />
                <span>Benachrichtigungen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
