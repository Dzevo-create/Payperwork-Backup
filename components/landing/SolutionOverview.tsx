"use client";

import { motion } from "framer-motion";
import { Zap, Palette, DollarSign, TrendingUp } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Sofortige Ergebnisse",
    description: "Upload → Workflow wählen → Fertig",
  },
  {
    icon: Palette,
    title: "Spezialisierte Workflows",
    description: "6 vordefinierte Workflows für jeden Use Case",
  },
  {
    icon: DollarSign,
    title: "Kosteneffizient",
    description: "Keine teuren Lizenzen oder Hardware nötig",
  },
  {
    icon: TrendingUp,
    title: "Ständig wachsend",
    description: "Community-Workflows & neue Features",
  },
];

export function SolutionOverview() {
  return (
    <section className="py-32 bg-luxury-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extralight text-luxury-black mb-4">
            Payperwork macht es anders
          </h2>
          <p className="text-lg font-light text-luxury-black/70 max-w-3xl mx-auto">
            Eine moderne Lösung für moderne Architekten
          </p>
        </motion.div>

        {/* 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="h-full bg-luxury-lightGray rounded-lg p-8 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 border border-luxury-black/10">
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-lg bg-luxury-black flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-luxury-white" strokeWidth={1.5} />
                    </div>

                    <h3 className="text-2xl font-light text-luxury-black mb-3">
                      {benefit.title}
                    </h3>

                    <p className="text-base font-light text-luxury-black/70">
                      {benefit.description}
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
