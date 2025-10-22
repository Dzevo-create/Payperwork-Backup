import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./error-suppression"; // Suppress known third-party warnings
import "@/lib/env-startup"; // Validate environment variables at startup
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://payperwork.ai"),
  title: {
    default: "Payperwork - AI Architektur Visualisierung | Von Skizze zu 3D Rendering",
    template: "%s | Payperwork",
  },
  description:
    "Transformiert Architektur-Skizzen mit AI in fotorealistische 3D-Renderings. 6 spezialisierte Workflows für Architekten. In Sekunden zur professionellen Visualisierung.",
  keywords: [
    "AI Architektur",
    "Architektur Rendering",
    "3D Visualisierung",
    "Architektur AI",
    "Sketch to Render",
    "Architektur Workflows",
  ],
  openGraph: {
    title: "Payperwork - AI Architektur Visualisierung",
    description: "Von der Skizze zur Visualisierung in Sekunden",
    url: "https://payperwork.ai",
    siteName: "Payperwork",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Payperwork - AI Architektur Visualisierung",
    description: "Von der Skizze zur Visualisierung in Sekunden",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* C1 SuperChat SDK Styles */}
        <link rel="stylesheet" href="/css/crayonai-react-ui.css" />
        <link rel="stylesheet" href="/css/genui-sdk.css" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
