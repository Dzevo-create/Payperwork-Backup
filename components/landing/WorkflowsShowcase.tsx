"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const workflows = [
  {
    id: "sketch-to-render",
    title: "Sketch to Render",
    description: "Handskizzen → Fotorealistische Renderings",
    useCase: "Konzeptentwicklung, Kundenpräsentationen",
    input: "Handskizze (max 2 Bilder)",
    output: "Fotorealistisches 3D-Rendering",
    featured: true,
    beforeImage: "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop&q=80",
  },
  {
    id: "style-transfer",
    title: "Style Transfer",
    description: "Architekturstil auf Gebäude übertragen",
    useCase: "Design-Varianten, Stilvergleiche",
    input: "Gebäudefoto + Referenzstil (max 4 Bilder)",
    output: "Gebäude im neuen Stil",
    beforeImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop&q=80",
  },
  {
    id: "render-to-cad",
    title: "Render to CAD",
    description: "Renderings → Technische Strichzeichnungen",
    useCase: "Baupläne, Technische Dokumentation",
    input: "Rendering/Foto (max 2 Bilder)",
    output: "Saubere CAD-Linienzeichnung",
    beforeImage: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=600&h=400&fit=crop&q=80",
  },
  {
    id: "furnish",
    title: "Furnish Empty Spaces",
    description: "Leere Räume virtuell möblieren",
    useCase: "Home Staging, Verkaufspräsentationen",
    input: "Leerer Raum (max 5 Bilder)",
    output: "Professionell möblierter Raum",
    beforeImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop&q=80",
  },
  {
    id: "branding",
    title: "Branding",
    description: "Marken-Integration in Spaces",
    useCase: "Flagship Stores, Branded Environments",
    input: "Space + Brand Guidelines (max 3 Bilder)",
    output: "Markenkonforme Visualisierung",
    beforeImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&h=400&fit=crop&q=80",
  },
  {
    id: "be-creative",
    title: "Be Creative",
    description: "Freies Kombinieren und Mixen",
    useCase: "Experimentelle Designs, Produktplatzierung",
    input: "Beliebige Bilder (max 10)",
    output: "Kreative Kombination",
    beforeImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80",
    afterImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop&q=80",
  },
];

function WorkflowCard({ workflow, index }: { workflow: typeof workflows[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`${workflow.featured ? "md:col-span-2 lg:col-span-2" : ""}`}
    >
      <Link href={`/workflows/${workflow.id}`}>
        <motion.div
          className="relative h-full group cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -6 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`h-full glassmorphism rounded-lg overflow-hidden ${
              workflow.featured ? "min-h-[500px]" : "min-h-[420px]"
            } flex flex-col hover:shadow-2xl transition-all duration-300`}
          >
            {/* Image Area with Before/After */}
            <div className="relative h-64 overflow-hidden">
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isHovered ? 0 : 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={workflow.beforeImage}
                  alt={`Before: ${workflow.description} - ${workflow.input}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-luxury-black/10" />
                <div className="absolute bottom-3 left-3 glassmorphism rounded-md px-3 py-1">
                  <p className="text-xs font-light tracking-wider text-luxury-black uppercase">
                    Vorher
                  </p>
                </div>
              </motion.div>
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={workflow.afterImage}
                  alt={`After: ${workflow.description} - ${workflow.output}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-luxury-black/10" />
                <div className="absolute bottom-3 right-3 glassmorphism rounded-md px-3 py-1">
                  <p className="text-xs font-light tracking-wider text-luxury-black uppercase">
                    Nachher
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-8 flex-1 flex flex-col justify-between">
              <div>
                <h3
                  className={`font-light text-luxury-black tracking-wide mb-3 ${
                    workflow.featured ? "text-3xl" : "text-2xl"
                  }`}
                >
                  {workflow.title}
                </h3>
                <p
                  className={`text-luxury-mediumGray font-light tracking-wide mb-4 ${
                    workflow.featured ? "text-base" : "text-sm"
                  }`}
                >
                  {workflow.description}
                </p>

                {/* Details */}
                <div className="space-y-2 text-sm font-light text-luxury-mediumGray">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-luxury-mediumGray/70">
                      Use Case:
                    </span>
                    <p className="mt-1">{workflow.useCase}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-luxury-black font-light tracking-wide group-hover:gap-3 transition-all mt-6">
                <span className="text-sm">Jetzt testen</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function WorkflowsShowcase() {
  return (
    <section id="workflows" className="py-40 bg-luxury-lightGray">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-7xl font-extralight text-luxury-black tracking-wide mb-6">
            6 Spezialisierte Workflows
          </h2>
          <p className="text-base font-light text-luxury-mediumGray tracking-wide max-w-3xl mx-auto">
            Jeder Workflow ist optimiert für einen spezifischen Anwendungsfall
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {workflows.map((workflow, index) => (
            <WorkflowCard key={workflow.id} workflow={workflow} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
