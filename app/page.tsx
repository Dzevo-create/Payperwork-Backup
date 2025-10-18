import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { ImageGallery } from "@/components/landing/ImageGallery";
import { Workflows } from "@/components/landing/Workflows";
import { TextMarquee } from "@/components/landing/TextMarquee";
import { Platform } from "@/components/landing/Platform";
import { ROI } from "@/components/landing/ROI";
import { Pricing } from "@/components/landing/Pricing";
import { SwissMade } from "@/components/landing/SwissMade";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <main>
        <Hero />
        <ProblemSolution />
        <ImageGallery />
        <Workflows />
        <TextMarquee />
        <Platform />
        <ROI />
        <Pricing />
        <SwissMade />
        <CTA />
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
