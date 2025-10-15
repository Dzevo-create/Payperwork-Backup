"use client";

/**
 * HeroShowcase Component
 * Displays the video showcase card on the right side of the hero section
 */

export function HeroShowcase() {
  return (
    <div className="relative w-full lg:w-[600px] xl:w-[700px] max-w-full">
      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-pw-accent/20 via-purple-500/10 to-pw-accent/20 rounded-3xl blur-2xl opacity-50" />

      {/* Main Card */}
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-3 sm:p-4 lg:p-6 overflow-hidden">
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Video Container */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
          <video
            autoPlay
            loop
            playsInline
            muted
            preload="metadata"
            controls
            className="w-full h-full object-cover"
          >
            <source src="/Video/Payperwork schnitt_1-2.mp4" type="video/mp4" />
            Ihr Browser unterstützt das Video-Tag nicht.
          </video>

          {/* Subtle Gradient Overlay for Luxus-Look */}
          <div className="absolute inset-0 bg-gradient-to-t from-pw-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
