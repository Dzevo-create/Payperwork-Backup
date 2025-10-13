"use client";

import { Clock, DollarSign, Lightbulb } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Zeitaufwendige Renderings",
    description: "Traditionelle 3D-Software erfordert Stunden an Arbeit für ein einzelnes Rendering.",
  },
  {
    icon: DollarSign,
    title: "Hohe Kosten",
    description: "Teure Lizenzen und Hardware-Anforderungen machen professionelle Visualisierung kostspielig.",
  },
  {
    icon: Lightbulb,
    title: "Steile Lernkurve",
    description: "Komplexe Software erfordert monatelanges Training für brauchbare Ergebnisse.",
  },
];

const solutions = [
  {
    number: "01",
    title: "KI-gestützte Workflows",
    description: "Nutze modernste KI-Modelle, trainiert auf Millionen von Architekturbildern, um in Sekunden fotorealistische Renderings zu erzeugen.",
  },
  {
    number: "02",
    title: "Einfache Bedienung",
    description: "Upload → Workflow wählen → Fertig. Keine komplizierte Software, keine monatelange Einarbeitung.",
  },
  {
    number: "03",
    title: "Kosteneffizient",
    description: "Zahle nur für was du nutzt. Keine teuren Lizenzen, keine Hardware-Upgrades, keine versteckten Kosten.",
  },
];

export function ProblemSolution() {
  return (
    <section className="py-24 bg-pw-light relative overflow-hidden">
      <div className="mx-auto px-6 lg:px-12">
        {/* Problem Section */}
        <div className="mb-24">
          <div className="grid lg:grid-cols-4 gap-12 items-stretch">
            {/* Left - 1/4 Text */}
            <div className="lg:col-span-1 flex flex-col justify-center space-y-6 text-left pr-8">
              <span className="pill bg-pw-black/10 text-pw-black border border-pw-black/20 inline-block w-fit">
                Das Problem
              </span>
              <h2 className="text-3xl lg:text-4xl font-light text-pw-black leading-tight">
                Traditionelle 3D-Visualisierung ist{" "}
                <span className="bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">zeitaufwendig</span>
              </h2>
              <p className="text-base text-pw-black/60">
                Komplexe Software, teure Lizenzen und monatelange Einarbeitung machen professionelle Visualisierung unzugänglich.
              </p>
            </div>

            {/* Right - 3/4 Cards in one row */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {problems.map((problem, index) => {
                const Icon = problem.icon;
                // Unique pattern, color and image for each card
                const cardStyles = [
                  {
                    color: '#9fa49e',
                    image: '/images/Pictures/Fotos/georgi-kalaydzhiev-Bnag6fJ1pHo-unsplash.jpg',
                    pattern: { size: '40px 40px', type: 'radial-gradient(circle at 2px 2px, currentColor 0.8px, transparent 0.8px)' }
                  },
                  {
                    color: '#a3a8a2',
                    image: '/images/Pictures/Fotos/max-harlynking-PGoEi8jL5BA-unsplash.jpg',
                    pattern: { size: '30px 30px', type: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 0.5px, transparent 0.5px, transparent 15px)' }
                  },
                  {
                    color: '#242424',
                    image: '/images/Pictures/Fotos/maximilian-jaenicke-wOtTh39V83g-unsplash.jpg',
                    pattern: { size: '25px 25px', type: 'linear-gradient(45deg, currentColor 1px, transparent 1px), linear-gradient(-45deg, currentColor 1px, transparent 1px)' }
                  }
                ];
                const cardStyle = cardStyles[index];

                return (
                  <div key={index} className="relative group">
                    {/* Card with Swiss Made style */}
                    <div className="relative rounded-3xl border border-pw-black/5 p-8 card-hover h-full overflow-hidden">
                      {/* Background Image */}
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url(${cardStyle.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />

                      {/* Color Overlay */}
                      <div className="absolute inset-0" style={{
                        backgroundColor: cardStyle.color,
                        opacity: 0.95
                      }} />

                      {/* Content */}
                      <div className="relative">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-3">
                          {problem.title}
                        </h3>
                        <p className="text-sm text-white/90 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div>
          <div className="grid lg:grid-cols-4 gap-12 items-stretch">
            {/* Left - 3/4 Cards in one row */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {solutions.map((solution, index) => {
                // Unique pattern, color and image for each solution card
                const cardStyles = [
                  {
                    color: '#50504f',
                    image: '/images/Pictures/Fotos/adrian-pelletier-QHJytUzTEkU-unsplash.jpg',
                    pattern: { size: '35px 35px', type: 'repeating-linear-gradient(-30deg, currentColor 0, currentColor 0.5px, transparent 0.5px, transparent 17px)' }
                  },
                  {
                    color: '#9fa49e',
                    image: '/images/Pictures/Fotos/ahmed-ununfDqAXJA-unsplash.jpg',
                    pattern: { size: '28px 28px', type: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)' }
                  },
                  {
                    color: '#a3a8a2',
                    image: '/images/Pictures/Fotos/hossein-nasr-g-rjNqX4Vfk-unsplash.jpg',
                    pattern: { size: '32px 16px', type: 'repeating-linear-gradient(0deg, currentColor 0, currentColor 0.5px, transparent 0.5px, transparent 16px)' }
                  }
                ];
                const cardStyle = cardStyles[index];

                return (
                  <div key={index} className="relative group">
                  {/* Card */}
                  <div className="relative rounded-3xl border border-pw-accent/10 p-8 card-hover h-full overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url(${cardStyle.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />

                    {/* Color Overlay */}
                    <div className="absolute inset-0" style={{
                      backgroundColor: cardStyle.color,
                      opacity: 0.95
                    }} />

                    {/* Content */}
                    <div className="relative">
                      {/* Number with white */}
                      <div className="text-6xl font-light text-white/50 mb-6">
                        {solution.number}
                      </div>
                      <h3 className="text-xl font-medium text-white mb-3">
                        {solution.title}
                      </h3>
                      <p className="text-sm text-white/90 leading-relaxed">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>

            {/* Right - 1/4 Text */}
            <div className="lg:col-span-1 flex flex-col justify-center space-y-6 text-left pl-8">
              <span className="pill bg-pw-accent/30 text-pw-black border border-pw-accent/40 inline-block w-fit">
                Die Lösung
              </span>
              <h2 className="text-3xl lg:text-4xl font-light text-pw-black leading-tight">
                Payperwork macht es{" "}
                <span className="bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">einfach</span>
              </h2>
              <p className="text-base text-pw-black/60">
                Eine moderne Plattform, die KI nutzt, um Architektur-Visualisierung für jeden zugänglich zu machen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
