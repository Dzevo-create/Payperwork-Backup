"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const transformations = [
  {
    title: "Skizze zu Rendering",
    before: "Handgezeichnete Skizze",
    after: "Fotorealistisches 3D-Rendering",
    description: "Verwandeln Sie einfache Handskizzen in professionelle Visualisierungen",
    beforeImage: "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Leer zu Möbliert",
    before: "Leerer Raum",
    after: "Vollständig eingerichteter Raum",
    description: "Virtuelles Staging für Immobilien in Sekunden",
    beforeImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Stil Transformation",
    before: "Klassisches Gebäude",
    after: "Moderner Stil",
    description: "Verschiedene Architekturstile für Ihre Projekte erkunden",
    beforeImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Konzept zu Realität",
    before: "Abstrakte Idee",
    after: "Konkrete Visualisierung",
    description: "Von der ersten Idee zum fertigen Rendering",
    beforeImage: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop&q=80",
  },
];

export function Transformations() {
  return (
    <section className="relative py-40 bg-luxury-white" id="transformations">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-5xl lg:text-7xl font-extralight text-luxury-black tracking-wide mb-6">
            AI Transformationen
          </h2>
          <p className="text-base font-light text-luxury-mediumGray tracking-wide">
            Sehen Sie, wie Payperwork Ihre Architektur-Visionen zum Leben erweckt
          </p>
        </div>

        {/* Transformations Grid */}
        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {transformations.map((item, index) => (
            <motion.div
              key={index}
              className="glassmorphism rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
            >
              {/* Before/After Visual with Real Images */}
              <div className="grid grid-cols-2 h-72">
                <div className="relative overflow-hidden">
                  <Image
                    src={item.beforeImage}
                    alt={item.before}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-luxury-black/20" />
                  <div className="absolute bottom-4 left-4 glassmorphism rounded-md px-4 py-2">
                    <p className="text-xs font-light text-luxury-black tracking-wider uppercase">
                      Vorher
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden">
                  <Image
                    src={item.afterImage}
                    alt={item.after}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-luxury-black/10" />
                  <div className="absolute bottom-4 right-4 glassmorphism rounded-md px-4 py-2">
                    <p className="text-xs font-light text-luxury-black tracking-wider uppercase">
                      Nachher
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-light text-luxury-black tracking-wide mb-3">
                  {item.title}
                </h3>
                <p className="text-sm font-light text-luxury-mediumGray tracking-wide mb-4 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 text-xs font-light text-luxury-mutedGray">
                  <span>{item.before}</span>
                  <span>→</span>
                  <span>{item.after}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
