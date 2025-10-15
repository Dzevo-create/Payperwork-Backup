"use client";

/**
 * VideoBackground Component
 * Displays an architecture background video with gradient overlay
 */

export function VideoBackground() {
  return (
    <div className="absolute inset-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/Video/kling_20251008_Image_to_Video_a_small_pu_4570_0.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
