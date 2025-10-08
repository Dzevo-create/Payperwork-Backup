"use client";

import { motion } from "framer-motion";
import { Upload, Sparkles, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload deine Dateien",
    description: "Bilder, Skizzen oder PDFs hochladen",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Workflow wählen",
    description: "Einen der 6 spezialisierten Workflows auswählen",
  },
  {
    number: "03",
    icon: Download,
    title: "Ergebnis herunterladen",
    description: "In Sekunden zum fertigen Rendering",
  },
];

export function HowItWorks() {
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
            So einfach funktioniert's
          </h2>
          <p className="text-lg font-light text-luxury-black/70 max-w-3xl mx-auto">
            In drei einfachen Schritten zum perfekten Rendering
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-px bg-luxury-black/10" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-luxury-white rounded-lg p-8 text-center relative z-10 border border-luxury-black/10 hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300">
                    {/* Step Number */}
                    <div className="text-6xl font-extralight text-luxury-black/20 mb-4">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 bg-luxury-black rounded-lg flex items-center justify-center">
                      <Icon className="w-8 h-8 text-luxury-white" strokeWidth={1.5} />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-light text-luxury-black mb-3">
                      {step.title}
                    </h3>
                    <p className="text-base font-light text-luxury-black/70">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
