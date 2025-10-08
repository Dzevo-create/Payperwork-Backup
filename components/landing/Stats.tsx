"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const stats = [
  {
    value: "12,847",
    label: "Transformationen heute",
  },
  {
    value: "50,000+",
    label: "Aktive Nutzer",
  },
  {
    value: "4.9/5",
    label: "Kundenbewertung",
    stars: true,
  },
];

export function Stats() {
  return (
    <section className="relative py-32 bg-luxury-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="glassmorphism rounded-lg p-10 text-center hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <h3 className="text-6xl font-extralight text-luxury-black tracking-wide mb-4">
                {stat.value}
              </h3>
              {stat.stars && (
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-luxury-black text-luxury-black"
                      strokeWidth={1}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs font-light text-luxury-mediumGray tracking-widest uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
