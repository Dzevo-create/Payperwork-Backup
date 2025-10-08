"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const galleryImages = [
  "/images/reve_images_2025-10-08_11-17-11/0c8b4734-898f-42b7-a892-bc0ac142376d.png",
  "/images/reve_images_2025-10-08_11-17-11/1dd418fa-c654-4612-8343-9dd3582f9de7.png",
  "/images/reve_images_2025-10-08_11-17-11/29147881-40b2-46a4-8c42-f664866ca023.png",
  "/images/reve_images_2025-10-08_11-17-11/30bb23b8-cf63-4bb8-b44a-a815155fe344.png",
  "/images/reve_images_2025-10-08_11-17-11/3e7be7b5-dd08-42bc-ba9b-3b90768d02a5.png",
  "/images/reve_images_2025-10-08_11-17-11/3ea5389d-1dc5-4134-ab85-5fade5eb4811.png",
  "/images/reve_images_2025-10-08_11-17-11/496fd117-cf5c-4fdd-83ce-c6ce3bece4f1.png",
  "/images/reve_images_2025-10-08_11-17-11/4a54d720-9db5-41b0-963f-ed9fc1bb6e59.png",
  "/images/reve_images_2025-10-08_11-17-11/4dc0dc05-db56-4047-a3f4-95f024d3e4ea.png",
  "/images/reve_images_2025-10-08_11-17-11/4f68c82e-798b-4dba-8365-c4764f1bafc1.png",
  "/images/reve_images_2025-10-08_11-17-11/5036ba8c-e5f6-4995-b5af-629df1e15af0.png",
  "/images/reve_images_2025-10-08_11-17-11/540e19da-1f4c-4c3d-94e8-0bdd1a9cca6a.png",
  "/images/reve_images_2025-10-08_11-17-11/5d0a037b-94d6-48f5-81f0-8492d4508023.png",
  "/images/reve_images_2025-10-08_11-17-11/5da97c37-3eb8-4c29-993f-14feef79f50c.png",
  "/images/reve_images_2025-10-08_11-17-11/634bc695-ecf5-4fe1-b445-6e00e24fb79f.png",
  "/images/reve_images_2025-10-08_11-17-11/64f7b687-11e0-47fc-a5ab-463c22b1129a.png",
  "/images/reve_images_2025-10-08_11-17-11/67b1ed59-3bcb-47f0-9195-d0502d4db509.png",
  "/images/reve_images_2025-10-08_11-17-11/6afa56c9-8cde-4d83-8d4e-72c7c2c100c1.png",
  "/images/reve_images_2025-10-08_11-17-11/6d41ff23-fa98-4d94-8d98-de8a07355a7c.png",
  "/images/reve_images_2025-10-08_11-17-11/7da4628b-0df2-46e2-8ff0-03b7ed25ea4c.png",
  "/images/reve_images_2025-10-08_11-17-11/80582d38-48da-44a8-9f08-679a24121396.png",
  "/images/reve_images_2025-10-08_11-17-11/8546fe52-b60e-434d-b665-0f79236e7fc4.png",
  "/images/reve_images_2025-10-08_11-17-11/8d1eada4-94ee-4ada-911f-bc4a20e9ec99.png",
  "/images/reve_images_2025-10-08_11-17-11/93097e97-56fb-43ac-a479-d0a5679cbc77.png",
  "/images/reve_images_2025-10-08_11-17-11/a206ddd3-94ba-4002-81cb-02a91b659006.png",
  "/images/reve_images_2025-10-08_11-17-11/a60e1fa9-6d31-489c-b466-4df2a5a2de8e.png",
  "/images/reve_images_2025-10-08_11-17-11/a98f88ab-bc89-41e2-92a5-87abeb1ebd4c.png",
  "/images/reve_images_2025-10-08_11-17-11/af16df15-17de-417d-803a-5803dcab9f6f.png",
  "/images/reve_images_2025-10-08_11-17-11/afc0a9f9-fb31-4fb2-9ee9-2c457f11f04e.png",
  "/images/reve_images_2025-10-08_11-17-11/d13bd4b6-c96c-4356-8d7f-1a6bcef1ba40.png",
  "/images/reve_images_2025-10-08_11-17-11/d22b99ee-7157-467a-882c-897576edcdaf.png",
  "/images/reve_images_2025-10-08_11-17-11/d3110de6-d93e-4ed0-9e04-d50902234432.png",
  "/images/reve_images_2025-10-08_11-17-11/d5af5a4a-dff8-4a0b-b0a8-935e2d5272be.png",
  "/images/reve_images_2025-10-08_11-17-11/e067af7e-775a-494e-a4fd-80842dede815.png",
  "/images/reve_images_2025-10-08_11-17-11/e2f84f3f-a34d-4821-8d4e-9c2e74f6380e.png",
  "/images/reve_images_2025-10-08_11-17-11/e5909511-ed2c-4991-a06c-eb4b65ed71f5.png",
  "/images/reve_images_2025-10-08_11-17-11/e71e42fa-68e5-4fc8-8030-6ed8ce543016.png",
  "/images/reve_images_2025-10-08_11-17-11/f458202d-b1cd-4d58-b6f3-afd313d9f395.png",
];

export function ImageGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const openLightbox = (src: string) => {
    setLightboxImage(src);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <section className="py-16 bg-pw-light overflow-hidden relative">

      {/* Gradient Fade Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-pw-light via-pw-light/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-pw-light via-pw-light/80 to-transparent z-10 pointer-events-none" />

      {/* Copyright Watermark */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
          <p className="text-xs text-pw-black/60">
            Generiert mit <span className="font-semibold text-pw-accent">Payperwork</span> · © 2025 Alle Rechte vorbehalten
          </p>
        </div>
      </div>

      {/* Auto-scrolling Image Row */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`flex gap-6 ${!isDragging ? 'animate-infinite-scroll' : ''}`}>
          {/* First set */}
          {galleryImages.map((src, index) => (
            <div
              key={`first-${index}`}
              className="relative h-80 w-96 flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-500 group"
              style={{
                transform: `perspective(1000px) rotateY(${index % 2 === 0 ? '2deg' : '-2deg'})`,
              }}
            >

              <div
                className="relative h-full w-full cursor-pointer"
                onClick={() => openLightbox(src)}
              >
                <Image
                  src={src}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-pw-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Accent corner */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-pw-accent/0 group-hover:border-pw-accent/60 transition-all duration-500 rounded-tr-lg" />
              </div>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {galleryImages.map((src, index) => (
            <div
              key={`second-${index}`}
              className="relative h-80 w-96 flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-500 group"
              style={{
                transform: `perspective(1000px) rotateY(${index % 2 === 0 ? '2deg' : '-2deg'})`,
              }}
            >

              <div
                className="relative h-full w-full cursor-pointer"
                onClick={() => openLightbox(src)}
              >
                <Image
                  src={src}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-pw-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Accent corner */}
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-pw-accent/0 group-hover:border-pw-accent/60 transition-all duration-500 rounded-tr-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-pw-accent transition-colors z-50"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={lightboxImage}
              alt="Lightbox image"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-infinite-scroll {
          animation: infinite-scroll 30s linear infinite;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
