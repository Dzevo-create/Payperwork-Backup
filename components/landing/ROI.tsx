"use client";

import { TrendingUp, Clock, Users, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

const stats = [
  {
    icon: Clock,
    value: "95%",
    label: "Zeitersparnis",
    description: "Im Vergleich zu traditioneller 3D-Software",
  },
  {
    icon: TrendingUp,
    value: "10x",
    label: "Mehr Projekte",
    description: "Bearbeite mehr Projekte in der gleichen Zeit",
  },
  {
    icon: Users,
    value: "5.000+",
    label: "Architekten",
    description: "Vertrauen bereits auf Payperwork",
  },
  {
    icon: Sparkles,
    value: "<30s",
    label: "Durchschnitt",
    description: "Vom Upload zum fertigen Rendering",
  },
];

const testimonials = [
  {
    quote: "Payperwork hat unsere Workflow-Effizienz revolutioniert",
    text: "Wir erstellen jetzt 3x mehr Visualisierungen pro Projekt und gewinnen deutlich mehr Ausschreibungen. Die Zeitersparnis hat es uns ermöglicht, unser Team um 40% zu vergrößern, ohne zusätzliche Software-Lizenzen zu kaufen.",
    name: "Daniel Zimmermann",
    role: "Geschäftsführer, Zimmermann Architekten AG",
    initials: "DZ",
    color: "#50504f",
    image: "/images/Pictures/Fotos/hossein-nasr-g-rjNqX4Vfk-unsplash.jpg"
  },
  {
    quote: "Die beste Investition für unser Studio",
    text: "Als mittelständisches Architekturbüro waren professionelle Renderings immer zeitaufwendig und teuer. Mit Payperwork erstellen wir fotorealistische Visualisierungen in Minuten. Unsere Kundenpräsentationen sind auf einem völlig neuen Level.",
    name: "Sophie Meier",
    role: "Partnerin, Meier & Hofmann Architekten",
    initials: "SM",
    color: "#a3a8a2",
    image: "/images/Pictures/Fotos/max-harlynking-PGoEi8jL5BA-unsplash.jpg"
  },
  {
    quote: "Unglaubliche Zeitersparnis bei Wettbewerben",
    text: "Früher verbrachten wir Tage mit Renderings für Wettbewerbsabgaben. Jetzt dauert es maximal eine Stunde für mehrere Varianten. Die KI versteht genau unsere Designsprache. Wir haben unsere Erfolgsquote um 65% gesteigert!",
    name: "Lukas Steiner",
    role: "Creative Director, Steiner Urban Design",
    initials: "LS",
    color: "#242424",
    image: "/images/Pictures/Fotos/adrian-pelletier-QHJytUzTEkU-unsplash.jpg"
  },
  {
    quote: "Perfekt für schnelle Kundeniterationen",
    text: "Unsere Kunden wollen verschiedene Optionen sehen, bevor sie sich entscheiden. Mit Payperwork können wir in einem Meeting live Varianten erstellen und anpassen. Das hat unsere Kundenzufriedenheit massiv erhöht.",
    name: "Anna Keller",
    role: "Projektleiterin, Keller Design Studio",
    initials: "AK",
    color: "#a3a8a2",
    image: "/images/Pictures/Fotos/georgi-kalaydzhiev-Bnag6fJ1pHo-unsplash.jpg"
  }
];

export function ROI() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const nextTestimonial = () => {
    setFadeOut(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setFadeOut(false);
    }, 300);
  };

  const prevTestimonial = () => {
    setFadeOut(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setFadeOut(false);
    }, 300);
  };

  const goToTestimonial = (index: number) => {
    if (index !== currentTestimonial) {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentTestimonial(index);
        setFadeOut(false);
      }, 300);
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        nextTestimonial();
      }, 6000); // Change every 6 seconds

      return () => clearInterval(interval);
    }
  }, [currentTestimonial, isHovering]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevTestimonial();
      } else if (e.key === 'ArrowRight') {
        nextTestimonial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="pt-0 pb-24 bg-pw-light relative overflow-hidden">
      <div className="mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 flex items-start justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-4xl lg:text-5xl font-light text-pw-black mb-4">
              Messbare{" "}
              <span className="bg-gradient-to-r from-pw-black to-pw-accent bg-clip-text text-transparent">
                Ergebnisse
              </span>
              {" "}für dein Business
            </h2>
            <p className="text-lg text-pw-black/60 max-w-3xl">
              Unsere Kunden sparen durchschnittlich 20+ Stunden pro Woche und steigern ihre Projektkapazität um das 10-fache.
            </p>
          </div>
          <span className="bg-pw-black/10 text-pw-black border border-pw-black/20 whitespace-nowrap px-6 py-3 rounded-full text-base font-medium h-fit">
            ROI & Performance
          </span>
        </div>

        {/* Stats Grid with Gray Tones */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            // Use same gray tones as ProblemSolution
            const colors = ['#a3a8a2', '#242424', '#a3a8a2', '#242424'];
            const cardColor = colors[index];
            // Get matching background image for each card
            const images = [
              '/images/Pictures/Fotos/georgi-kalaydzhiev-Bnag6fJ1pHo-unsplash.jpg',
              '/images/Pictures/Fotos/maximilian-jaenicke-wOtTh39V83g-unsplash.jpg',
              '/images/Pictures/Fotos/max-harlynking-PGoEi8jL5BA-unsplash.jpg',
              '/images/Pictures/Fotos/adrian-pelletier-QHJytUzTEkU-unsplash.jpg'
            ];

            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Card */}
                <div className="relative rounded-3xl border border-pw-black/5 p-6 card-hover text-center h-full overflow-hidden">
                  {/* Background Image */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url(${images[index]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />

                  {/* Color Overlay */}
                  <div className="absolute inset-0" style={{
                    backgroundColor: cardColor,
                    opacity: 0.95
                  }} />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>

                    {/* Value */}
                    <div className="text-4xl font-semibold text-white mb-2">
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-base font-medium text-white mb-3">
                      {stat.label}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/90 leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonial Slider */}
        <div
          className="relative group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Main Card */}
          <div className="relative rounded-3xl border border-pw-black/5 p-12 lg:p-16 overflow-hidden transition-all duration-500">
            {/* Background Image */}
            <div className="absolute inset-0 transition-opacity duration-500" style={{
              backgroundImage: `url(${testimonials[currentTestimonial].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />

            {/* Color Overlay */}
            <div className="absolute inset-0 transition-all duration-500" style={{
              backgroundColor: testimonials[currentTestimonial].color,
              opacity: 0.95
            }} />

            {/* Content with fade animation */}
            <div className={`relative max-w-4xl mx-auto text-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
              <h3 className="text-2xl lg:text-3xl font-light text-white mb-6">
                "{testimonials[currentTestimonial].quote.split(' ').slice(0, -1).join(' ')}{" "}
                <span className="bg-gradient-to-r from-white to-pw-accent bg-clip-text text-transparent">
                  {testimonials[currentTestimonial].quote.split(' ').slice(-1)}
                </span>
                "
              </h3>
              <p className="text-base text-white/90 mb-8 leading-relaxed">
                {testimonials[currentTestimonial].text}
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-semibold text-white">
                  {testimonials[currentTestimonial].initials}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{testimonials[currentTestimonial].name}</div>
                  <div className="text-xs text-white/70">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Visible on mobile, hover on desktop */}
          <button
            onClick={prevTestimonial}
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-white/90 rounded-full flex items-center justify-center transition-all shadow-lg md:opacity-0 md:group-hover:opacity-100 hover:scale-110"
            aria-label="Vorheriges Testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-pw-black" strokeWidth={2.5} />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-white/90 rounded-full flex items-center justify-center transition-all shadow-lg md:opacity-0 md:group-hover:opacity-100 hover:scale-110"
            aria-label="Nächstes Testimonial"
          >
            <ChevronRight className="w-6 h-6 text-pw-black" strokeWidth={2.5} />
          </button>

          {/* Dots Indicator - More elegant */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentTestimonial
                    ? 'bg-pw-black w-12'
                    : 'bg-pw-black/20 w-2 hover:bg-pw-black/40'
                }`}
                aria-label={`Gehe zu Testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
