"use client";

import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "99",
    period: "Monat",
    credits: "3000 Credits pro Monat",
    description: "Für Einzelpersonen und kleine Projekte",
    features: [
      "3000 Credits",
      "Alle KI-Workflows",
      "4K-Qualität Exports",
      "E-Mail Support",
      "Kommerzielle Nutzung",
    ],
  },
  {
    name: "Pro",
    price: "199",
    period: "Monat",
    credits: "6500 Credits pro Monat",
    description: "Für professionelle Architekten",
    features: [
      "6500 Credits",
      "Alle KI-Workflows",
      "4K-Qualität Exports",
      "Prioritäts-Support",
      "Kommerzielle Nutzung",
      "Team-Kollaboration",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: null,
    period: null,
    credits: "Unbegrenzt",
    description: "Für große Teams und Firmen",
    features: [
      "Unbegrenzte Credits",
      "Alle KI-Workflows",
      "8K-Qualität Exports",
      "Dedizierter Support",
      "Kommerzielle Nutzung",
      "API-Zugang",
      "Team-Kollaboration",
      "Custom AI Training",
      "SLA Garantie",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="pt-12 pb-6 bg-pw-light px-2 sm:px-3 lg:px-4">
      <div className="relative bg-pw-light rounded-2xl overflow-hidden shadow-lg max-w-[1600px] mx-auto">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-90">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("/images/Pictures/Fotos/osarugue-igbinoba-KAV2zf0qUS0-unsplash.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        </div>

        {/* Giant Pricing Background Text */}
        <div className="absolute top-0 left-0 right-0 h-[450px] flex items-start justify-center pointer-events-none pt-8">
          <h1 className="text-[10rem] lg:text-[14rem] xl:text-[16rem] font-black text-pw-black/[0.08] select-none leading-none tracking-wide">
            Pricing
          </h1>
        </div>

        <div className="container mx-auto px-6 lg:px-12 max-w-7xl relative z-10 py-12">
          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 pt-40">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-br from-white/70 to-white/60 hover:from-white/80 hover:to-white/70 backdrop-blur-lg rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col group ${
                  plan.popular
                    ? "border-pw-accent/40 shadow-xl md:scale-105 shadow-pw-accent/20"
                    : "border-pw-black/10"
                }`}
              >
              {/* Plan Name & Description */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-pw-black mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-pw-black/60">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                {plan.price ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-pw-black/60">
                        CHF
                      </span>
                      <span className="text-6xl font-bold bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-lg text-pw-black/60 ml-1">
                        / {plan.period}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-pw-black/80 mt-3">
                      {plan.credits}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">
                      Auf Anfrage
                    </div>
                    <p className="text-sm font-semibold text-pw-black/80 mt-3">
                      {plan.credits}
                    </p>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 group/item">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pw-accent/30 flex items-center justify-center mt-0.5 group-hover/item:bg-pw-accent/40 transition-colors">
                      <Check className="w-4 h-4 text-pw-black" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-pw-black/90 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA - Always at bottom */}
              <div className="mt-auto">
                <Link href={plan.price ? "/get-started" : "/contact"}>
                  <button
                    className={`w-full py-4 rounded-full font-semibold text-base transition-all duration-300 ${
                      plan.popular
                        ? "bg-pw-accent text-pw-black hover:bg-pw-accent/90 hover:shadow-xl hover:scale-105"
                        : "bg-pw-black text-white hover:bg-pw-black/90 hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    {plan.price ? "Jetzt starten" : "Kontakt aufnehmen"}
                  </button>
                </Link>
              </div>
            </div>
            ))}
          </div>

          {/* FAQ / Note */}
          <div className="text-center mt-8">
            <p className="text-sm text-white/90 bg-pw-black/60 backdrop-blur-sm inline-block px-6 py-2 rounded-full">
              Alle Preise zzgl. MwSt. · Jederzeit kündbar
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
