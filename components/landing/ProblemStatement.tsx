"use client";

import { motion } from "framer-motion";
import { DollarSign, Clock, Target } from "lucide-react";

const painPoints = [
  {
    icon: DollarSign,
    title: "Teure Rendering-Software",
    description: "Monatliche Kosten von 500€+ für Lizenzen",
  },
  {
    icon: Clock,
    title: "Wochenlange Einarbeitung",
    description: "Monate lernen bis zum ersten Ergebnis",
  },
  {
    icon: Target,
    title: "Generische AI-Tools verstehen Architektur nicht",
    description: "ChatGPT & Midjourney kennen keine Fachbegriffe",
    large: true,
  },
];

export function ProblemStatement() {
  return (
    <section className="py-32 bg-luxury-lightGray">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extralight text-luxury-black mb-4">
            Die Herausforderung traditioneller Visualisierung
          </h2>
          <p className="text-lg font-light text-luxury-black/70 max-w-3xl mx-auto">
            Architekten verlieren Zeit und Geld mit veralteten Methoden
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative group ${
                  point.large ? "md:col-span-2" : ""
                }`}
              >
                <div className="h-full bg-luxury-white rounded-lg p-8 border border-luxury-black/10 hover:shadow-lg hover:shadow-black/5 transition-all duration-300">
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-lg bg-luxury-black/5 border border-luxury-black/10 flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-luxury-black" strokeWidth={1.5} />
                    </div>

                    <h3 className="text-2xl font-light text-luxury-black mb-3">
                      {point.title}
                    </h3>

                    <p className="text-base font-light text-luxury-black/70">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
