"use client";

import Link from 'next/link';
import { Settings, User, LogOut, Moon, Bell, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SidebarFooterProps {
  credits?: number;
}

export function SidebarFooter({ credits = 3000 }: SidebarFooterProps) {
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
          className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 hover:scale-110"
          aria-label="Home"
          title="Zur Startseite"
        >
          <Home className="w-4 h-4 text-pw-black/60" />
        </Link>

        {/* Profile Dropdown */}
        <div className="relative flex-1" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 flex items-center gap-2"
            aria-label="Profile"
          >
            <User className="w-4 h-4 text-pw-black/60" />
            <span className="text-xs font-medium text-pw-black/80 flex-1 text-left">Profil</span>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-2 z-50">
              <div className="px-4 py-2 border-b border-pw-black/10">
                <p className="text-sm font-semibold text-pw-black">Benutzer</p>
                <p className="text-xs text-pw-black/60">user@example.com</p>
              </div>
              {/* Credits in Dropdown */}
              <div className="px-4 py-3 border-b border-pw-black/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-pw-black/60">Credits</span>
                  <span className="text-sm font-bold text-pw-accent">{credits}</span>
                </div>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>Profil bearbeiten</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 active:bg-red-200 transition-all duration-150 flex items-center gap-3 text-red-600">
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-pw-black/60" />
          </button>

          {showSettingsMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-2 z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Benachrichtigungen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
