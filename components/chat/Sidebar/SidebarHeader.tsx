"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarHeader({ isCollapsed = false, onToggleCollapse }: SidebarHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
      {!isCollapsed && (
        <Link href="/" className="inline-block">
          <Image
            src="/images/Logo/logo-black.png"
            alt="Payperwork Logo"
            width={90}
            height={26}
            className="h-4 w-auto"
          />
        </Link>
      )}

      <button
        onClick={onToggleCollapse}
        className="p-1.5 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 hover:scale-110 ml-auto"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-pw-black/60" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-pw-black/60" />
        )}
      </button>
    </div>
  );
}
