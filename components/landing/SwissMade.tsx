"use client";

import { Award, Users, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Swiss Made AI",
    description: "Entwickelt und betrieben in Zürich mit höchsten Qualitätsstandards",
  },
  {
    icon: Zap,
    title: "Höchste Performance",
    description: "Optimierte Infrastruktur für schnellste Verarbeitungszeiten",
  },
  {
    icon: Users,
    title: "Lokaler Support",
    description: "Deutschsprachiges Support-Team in der Schweiz",
  },
  {
    icon: Globe,
    title: "Schweizer Server",
    description: "Alle Daten werden in Schweizer Rechenzentren verarbeitet",
  },
];

export function SwissMade() {
  return (
    <section className="pt-12 pb-24 bg-pw-light px-2 sm:px-3 lg:px-4">
      <div className="relative bg-pw-light rounded-2xl overflow-hidden shadow-lg max-w-[1600px] mx-auto">
        {/* Swiss Architecture Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("/images/Pictures/Fotos/planet-volumes-6vcNYw7X_I8-unsplash.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        </div>

        {/* Giant Swiss Made Background Text */}
        <div className="absolute top-0 left-0 right-0 h-[300px] flex items-start justify-center pointer-events-none pt-[120px]">
          <h1 className="text-[6rem] lg:text-[8rem] xl:text-[10rem] font-black text-pw-black/[0.05] select-none leading-none tracking-wide">
            SWISS MADE
          </h1>
        </div>

        <div className="relative container mx-auto px-6 lg:px-12 max-w-7xl py-24 z-10">

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-32">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white/70 to-white/60 backdrop-blur-lg rounded-2xl border border-pw-black/10 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-pw-accent rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Icon className="w-8 h-8 text-pw-black" strokeWidth={1.5} />
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-lg font-semibold text-pw-black mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-pw-black/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
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
