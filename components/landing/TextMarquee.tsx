"use client";

const solutions = [
  "Keine teure 3D-Software mehr",
  "Sparen Sie 95% Zeit",
  "Sofort fotorealistische Ergebnisse",
  "Keine monatelange Einarbeitung",
  "Keine Hardware-Upgrades nötig",
  "10x mehr Projekte bearbeiten",
  "Kosten um 70% senken",
  "Professionell ohne Vorkenntnisse",
  "Renderings in unter 30 Sekunden",
  "Keine komplizierten Tutorials",
  "Swiss Made Quality 🇨🇭",
  "Workflows statt Wartezeit",
];

export function TextMarquee() {
  return (
    <section className="pt-0 pb-12 bg-pw-light overflow-hidden relative">
      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-pw-light via-pw-light/80 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-pw-light via-pw-light/80 to-transparent z-10" />

      {/* Scrolling Container */}
      <div className="flex gap-4">
        <div className="flex gap-4 animate-infinite-scroll">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-full border border-pw-black/10"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent whitespace-nowrap">
                {solution}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 animate-infinite-scroll">
          {solutions.map((solution, index) => (
            <div
              key={`duplicate-${index}`}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-full border border-pw-black/10"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent whitespace-nowrap">
                {solution}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
