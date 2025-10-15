"use client";

interface NavigationSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * NavigationSection Component
 *
 * Reusable section component for Sidebar navigation groups (Workflows, Chats, etc.)
 */
export function NavigationSection({ title, children }: NavigationSectionProps) {
  return (
    <div className="flex flex-col">
      {/* Section Label */}
      <div className="px-4 py-2">
        <p className="text-xs text-pw-black/50 font-semibold uppercase tracking-wide">
          {title}
        </p>
      </div>

      {/* Section Content */}
      <div className="px-2">
        {children}
      </div>
    </div>
  );
}
