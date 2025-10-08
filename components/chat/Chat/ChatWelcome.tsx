"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

interface ChatWelcomeProps {
  onSendMessage: (content: string) => void;
}

export function ChatWelcome({ onSendMessage }: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo/Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <Image
            src="/images/Logo/logo-black.png"
            alt="Payperwork Logo"
            width={200}
            height={60}
            className="object-contain"
          />
        </div>
        <p className="text-pw-black/60 text-lg">
          Wo sollen wir anfangen?
        </p>
      </div>
    </div>
  );
}
