"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const services = [
  {
    title: "Leer → Möbliert",
    description: "Leere Räume in vollständig eingerichtete Traumräume verwandeln",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Skizze → Render",
    description: "Verwandeln Sie Handskizzen in professionelle fotorealistische Renderings",
    image: "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Stil Wechseln",
    description: "Architekturstile nahtlos übertragen und neue Design-Varianten erkunden",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80",
  },
  {
    title: "Virtuelle Renovation",
    description: "Renovierungen und Umbauten vor der Umsetzung visualisieren",
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop&q=80",
  },
];

export function Services() {
  return (
    <section className="relative py-40 bg-luxury-lightGray" id="services">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-5xl lg:text-7xl font-extralight text-luxury-black tracking-wide mb-6">
            Transformationen
          </h2>
          <p className="text-base font-light text-luxury-mediumGray tracking-wide">
            AI-powered Visualisierung für moderne Architektur
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="group glassmorphism rounded-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-light text-luxury-black tracking-wide mb-4">
                  {service.title}
                </h3>
                <p className="text-sm font-light text-luxury-mediumGray tracking-wide leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
