"use client";

import { Cpu, Zap, Globe, Users, Cloud } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Modernste KI-Modelle",
    description: "Trainiert auf Millionen von Architekturbildern für höchste Qualität",
  },
  {
    icon: Zap,
    title: "Blitzschnell",
    description: "Durchschnittliche Verarbeitungszeit unter 30 Sekunden pro Workflow",
  },
  {
    icon: Cloud,
    title: "Cloud-basiert",
    description: "Keine lokale Installation nötig – arbeite von überall aus",
  },
  {
    icon: Globe,
    title: "Weltweit verfügbar",
    description: "Greife von jedem Ort der Welt auf deine Projekte zu",
  },
  {
    icon: Users,
    title: "Team-Features",
    description: "Teile Workflows und Ergebnisse nahtlos mit deinem Team",
  },
];

export function Platform() {
  return (
    <section className="pt-2 pb-24 bg-pw-light px-2 sm:px-3 lg:px-4">
      <div className="mx-auto">
        <div className="relative px-8 py-16 lg:px-16 lg:py-20">
          {/* Background Image */}
          <div className="absolute inset-0 opacity-10 rounded-2xl overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'url("/images/Pictures/Fotos/daniele-levis-pelusi-oYVc6qi-i-8-unsplash.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          </div>

          {/* Header */}
          <div className="relative mb-12 flex items-start justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-4xl lg:text-5xl font-light text-pw-black mb-4">
                Gebaut für{" "}
                <span className="bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">
                  kreative Profis
                </span>
              </h2>
              <p className="text-lg text-pw-black/60 max-w-3xl">
                Eine moderne, cloud-basierte Plattform mit Enterprise-Features und Schweizer Qualitätsstandards.
              </p>
            </div>
            <span className="bg-pw-black/10 text-pw-black border border-pw-black/20 whitespace-nowrap px-6 py-3 rounded-full text-base font-medium">
              Die Plattform
            </span>
          </div>

          {/* Features Grid - All 5 in one row */}
          <div className="relative grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="relative bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-3xl border border-pw-black/10 p-6 transition-all duration-300 hover:shadow-xl h-full">
                    {/* Icon with Gray Background */}
                    <div className="w-12 h-12 bg-pw-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-pw-black" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-pw-black mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-pw-black/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
