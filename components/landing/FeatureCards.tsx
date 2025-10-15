"use client";

/**
 * FeatureCards Component
 * Displays a grid of feature cards showcasing key product benefits
 */

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: (
      <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Blitzschnell",
    description: "Ergebnisse in Sekunden statt Stunden",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "KI-gestützt",
    description: "Modernste AI-Technologie",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    ),
    title: "Intuitiv",
    description: "Keine Einarbeitung nötig",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Präzise",
    description: "Fotorealistische Ergebnisse",
  },
];

export function FeatureCards() {
  return (
    <div className="mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="relative group">
          <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
            <div className="relative">
              <div className="w-10 h-10 bg-pw-accent/10 rounded-lg flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="text-base font-medium text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
