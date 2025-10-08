"use client";

import Link from "next/link";
import { Twitter, Linkedin, Mail } from "lucide-react";
import Image from "next/image";

const footerLinks = {
  product: [
    { label: "Workflows", href: "#workflows" },
    { label: "Pricing", href: "#pricing" },
    { label: "Beispiele", href: "#beispiele" },
    { label: "API", href: "/api" },
  ],
  company: [
    { label: "Über uns", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Karriere", href: "/careers" },
    { label: "Kontakt", href: "/contact" },
  ],
  legal: [
    { label: "Datenschutz", href: "/privacy" },
    { label: "AGB", href: "/terms" },
    { label: "Impressum", href: "/imprint" },
  ],
  resources: [
    { label: "Dokumentation", href: "/docs" },
    { label: "Community", href: "/community" },
    { label: "Support", href: "/support" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/payperwork", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/payperwork", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@payperwork.ai", label: "Email" },
];

export function Footer() {
  return (
    <footer className="relative bg-pw-dark text-white pt-16 pb-8 rounded-t-3xl overflow-hidden shadow-2xl">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/Video/kling_20251008_Image_to_Video_a_small_pu_5123_0.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-pw-dark/98" />
      </div>

      <div className="relative container mx-auto px-6 lg:px-12 max-w-7xl">
        {/* Logo & Description */}
        <div className="mb-12">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/Logo/logo-white.png"
              alt="Payperwork Logo"
              width={160}
              height={45}
              className="h-9 w-auto"
            />
          </Link>
          <p className="text-sm text-white/60 max-w-md">
            KI-Plattform für Architektur-Visualisierung.
            Entwickelt in Zürich mit höchsten Qualitäts- und Datenschutzstandards.
          </p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product Links */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 mb-12">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={social.label}
              >
                <Icon className="w-4 h-4 text-white/70" strokeWidth={1.5} />
              </a>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
            <p>
              © {new Date().getFullYear()} Payperwork. Alle Rechte vorbehalten.
            </p>
            <div className="flex items-center gap-6">
              <span>Made in Zürich 🇨🇭</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
