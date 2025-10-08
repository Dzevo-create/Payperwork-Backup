"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-pw-light">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1600px]">
        {/* Large CTA Card with Architecture Background */}
        <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* Architecture Background Image */}
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              backgroundImage: 'url("/images/Pictures/Fotos/getty-images-bTLmx9a31Yw-unsplash.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            {/* White Overlay */}
            <div className="absolute inset-0 bg-white/95" />
          </div>

          <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-24 text-center">
            {/* Pill with Gradient */}
            <div className="inline-flex mb-6">
              <span className="pill bg-pw-black/10 text-pw-black border border-pw-black/20">
                Jetzt starten
              </span>
            </div>

            {/* Headline with Gradient Text */}
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-light text-pw-black mb-6 max-w-4xl mx-auto">
              Bereit, deine Architektur-Visualisierung zu{" "}
              <span className="bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">
                revolutionieren
              </span>
              ?
            </h2>

            {/* Subline */}
            <p className="text-lg text-pw-black/60 mb-10 max-w-2xl mx-auto">
              Starte heute kostenlos und erlebe, wie schnell professionelle Renderings sein können.
              Keine Kreditkarte erforderlich.
            </p>

            {/* CTA Buttons with Enhanced Gradients */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Link href="/get-started">
                <button className="group relative px-8 py-4 bg-pw-black text-white text-base font-medium rounded-full hover:bg-pw-black/90 transition-all inline-flex items-center gap-2 shadow-lg">
                  <span className="relative">Kostenlos starten</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
                </button>
              </Link>
              <Link href="#workflows">
                <button className="px-8 py-4 bg-transparent text-pw-black text-base font-medium rounded-full border border-pw-black/20 hover:border-pw-black/40 hover:bg-pw-black/5 transition-all">
                  Demo ansehen
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-pw-black/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pw-black/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-pw-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Keine Kreditkarte</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pw-black/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-pw-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Jederzeit kündbar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pw-black/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-pw-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Swiss Made 🇨🇭</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
