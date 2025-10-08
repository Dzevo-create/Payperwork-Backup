"use client";

import { Sparkles, Home, Palette, Edit, Box, Video, Layers, Wand2, FileText, Camera } from "lucide-react";

const workflows = [
  {
    icon: Sparkles,
    name: "Sketch-to-Render",
    description: "Wandelt 2D-Skizzen und CAD-Zeichnungen in fotorealistische 3D-Renderings um",
    input: "Skizze, CAD, PDF",
    output: "Fotorealistisches Rendering",
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconColor: "from-yellow-400 to-orange-500",
  },
  {
    icon: Home,
    name: "Furnish-Empty",
    description: "Virtuelles Staging leerer Räume mit intelligenter Möbelplatzierung",
    input: "Leerer Raum",
    output: "Eingerichteter Raum",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "from-blue-400 to-cyan-500",
  },
  {
    icon: Palette,
    name: "Style-Transfer",
    description: "Überträgt architektonische Stile und Materialitäten auf Designs",
    input: "Design + Referenz",
    output: "Design im neuen Stil",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "from-purple-400 to-pink-500",
  },
  {
    icon: Edit,
    name: "Draw-to-Edit",
    description: "KI-unterstützter Editor für präzise maskenbasierte Änderungen",
    input: "Rendering + Maske",
    output: "Angepasstes Rendering",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "from-green-400 to-emerald-500",
  },
  {
    icon: Box,
    name: "Volume-to-Render",
    description: "Erstellt aus 3D-Volumenmodellen realistische Renderings",
    input: "3D-Volumenmodell",
    output: "Fotorealistisches Rendering",
    gradient: "from-indigo-500/20 to-blue-500/20",
    iconColor: "from-indigo-400 to-blue-500",
  },
  {
    icon: Camera,
    name: "Image-to-Perspectives",
    description: "Generiert multiple Perspektiven automatisch (Frontal, Seiten, Vogelperspektive)",
    input: "Einzelbild",
    output: "Multi-Perspektiven",
    gradient: "from-rose-500/20 to-red-500/20",
    iconColor: "from-rose-400 to-red-500",
  },
  {
    icon: Wand2,
    name: "Branding",
    description: "Erstellt markenkonforme Innenräume unter Berücksichtigung von CI/CD",
    input: "Raum + Marke",
    output: "Branded Interior",
    gradient: "from-amber-500/20 to-yellow-500/20",
    iconColor: "from-amber-400 to-yellow-500",
  },
  {
    icon: Layers,
    name: "Be-Creative",
    description: "Experimenteller Modus für künstlerische und konzeptionelle Visualisierungen",
    input: "Bis zu 10 Referenzen",
    output: "Concept-Art",
    gradient: "from-fuchsia-500/20 to-purple-500/20",
    iconColor: "from-fuchsia-400 to-purple-500",
  },
  {
    icon: FileText,
    name: "Render-to-CAD",
    description: "Konvertiert Renderings zurück in technische CAD-Zeichnungen",
    input: "Rendering/Foto",
    output: "CAD (.dwg, .dxf)",
    gradient: "from-teal-500/20 to-cyan-500/20",
    iconColor: "from-teal-400 to-cyan-500",
  },
  {
    icon: Video,
    name: "Image-to-Video",
    description: "Transformiert statische Renderings in cineastische Video-Animationen",
    input: "Einzelbilder",
    output: "Walkthrough-Video",
    gradient: "from-violet-500/20 to-indigo-500/20",
    iconColor: "from-violet-400 to-indigo-500",
  },
];

export function Workflows() {
  return (
    <section id="workflows" className="pt-24 pb-12 bg-pw-light overflow-hidden px-2 sm:px-3 lg:px-4">
      {/* Large Card Container */}
      <div className="relative bg-pw-dark rounded-2xl overflow-hidden shadow-2xl">
        {/* Background Image */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(/images/Pictures/Fotos/123r2r1333122.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-pw-dark" style={{
          opacity: 0.40
        }} />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative container mx-auto px-6 lg:px-12 max-w-7xl py-12">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-3xl lg:text-4xl font-normal text-white mb-3">
              Modulare Plattform, die kontinuierlich{" "}
              <span className="bg-gradient-to-r from-white to-pw-accent bg-clip-text text-transparent">wächst</span>
            </h2>
            <p className="text-base text-white/60 max-w-3xl">
              Jeder Workflow ist speziell für einen Anwendungsfall optimiert. Wir fügen laufend neue Workflows hinzu.
            </p>
          </div>
          <span className="bg-gradient-to-r from-pw-accent/20 to-pw-accent/10 text-white border border-pw-accent/30 whitespace-nowrap px-6 py-3 rounded-full text-base font-medium">
            Spezialisierte KI-Workflows
          </span>
        </div>

        {/* Workflows Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {workflows.map((workflow, index) => {
            const Icon = workflow.icon;
            // Clean pattern: alternating rows of light and dark
            // Row 1: all light (5 cards)
            // Row 2: all dark (5 cards)
            const colorPattern = [
              '#a3a8a2', '#a3a8a2', '#a3a8a2', '#a3a8a2', '#a3a8a2',  // Row 1: alle hell
              '#242424', '#242424', '#242424', '#242424', '#242424'   // Row 2: alle dunkel
            ];
            const cardColor = colorPattern[index];

            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Card with Glassmorphism */}
                <div className="relative rounded-xl border border-white/10 p-4 card-hover h-full overflow-hidden backdrop-blur-sm w-full" style={{
                  backgroundColor: `${cardColor}dd`
                }}>
                  {/* Icon */}
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-medium text-white mb-1.5">
                    {workflow.name}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-white/60 mb-3 leading-relaxed">
                    {workflow.description}
                  </p>

                  {/* Input/Output */}
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[9px] text-white/40 min-w-[40px]">Input:</span>
                      <span className="text-[9px] text-white/60">{workflow.input}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[9px] text-white/40 min-w-[40px]">Output:</span>
                      <span className="text-[9px] text-white/60">{workflow.output}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
          >
            Alle Workflows testen
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
