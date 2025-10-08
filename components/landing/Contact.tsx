"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Contact() {
  return (
    <section className="relative py-40 bg-luxury-black" id="contact">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl lg:text-7xl font-extralight text-luxury-white tracking-wide mb-8">
              Bereit für Payperwork?
            </h2>
            <p className="text-base font-light text-luxury-mutedGray tracking-wide mb-12 max-w-2xl mx-auto">
              Transformieren Sie Ihre Architektur-Ideen in fotorealistische Renderings
            </p>

            {/* CTA Button */}
            <Link href="/get-started">
              <motion.button
                className="group inline-flex items-center justify-center px-14 py-4 glassmorphism rounded-md hover:bg-white/20 transition-all"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm font-light text-luxury-white tracking-wider">
                  Kostenlos testen
                </span>
                <ArrowRight className="ml-3 w-4 h-4 text-luxury-white group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            {/* Trust Badge */}
            <p className="text-xs font-light text-luxury-mutedGray tracking-wider mt-10">
              Keine Kreditkarte erforderlich · 7 Tage kostenlos testen
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
