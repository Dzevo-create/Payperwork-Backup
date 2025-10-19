/**
 * Quality Scorer Utility
 *
 * Calculates quality scores for generated presentations
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import type { SlideContent, ResearchServiceOutput } from '../types';

export interface QualityCheckResult {
  score: number;
  issues: string[];
  checks: {
    emptySlides: number;
    tooShortSlides: number;
    hasIntroduction: boolean;
    hasConclusion: boolean;
    usedResearch: boolean;
  };
}

export class QualityScorer {
  /**
   * Calculate quality score for slides
   */
  static calculate(
    slides: SlideContent[],
    research?: ResearchServiceOutput
  ): QualityCheckResult {
    const checks = {
      emptySlides: 0,
      tooShortSlides: 0,
      hasIntroduction: false,
      hasConclusion: false,
      usedResearch: false,
    };

    const issues: string[] = [];
    let score = 100;

    // Check 1: Empty slides
    const emptySlides = slides.filter((s) => !s.content || s.content.trim().length < 10);
    checks.emptySlides = emptySlides.length;
    if (emptySlides.length > 0) {
      const penalty = emptySlides.length * 10;
      score -= penalty;
      issues.push(`${emptySlides.length} slides have no or minimal content (-${penalty} points)`);
    }

    // Check 2: Too short slides
    const tooShortSlides = slides.filter(
      (s) => s.content && s.content.split(/\s+/).length < 20
    );
    checks.tooShortSlides = tooShortSlides.length;
    if (tooShortSlides.length > 0) {
      const penalty = tooShortSlides.length * 5;
      score -= penalty;
      issues.push(`${tooShortSlides.length} slides are too short (-${penalty} points)`);
    }

    // Check 3: Introduction slide
    if (slides[0]) {
      const firstTitle = slides[0].title.toLowerCase();
      checks.hasIntroduction =
        firstTitle.includes('einleitung') || firstTitle.includes('introduction');

      if (!checks.hasIntroduction) {
        score -= 5;
        issues.push('First slide is not an introduction (-5 points)');
      }
    }

    // Check 4: Conclusion slide
    const lastSlide = slides[slides.length - 1];
    if (lastSlide) {
      const lastTitle = lastSlide.title.toLowerCase();
      checks.hasConclusion =
        lastTitle.includes('fazit') ||
        lastTitle.includes('zusammenfassung') ||
        lastTitle.includes('conclusion');

      if (!checks.hasConclusion) {
        score -= 5;
        issues.push('Last slide is not a conclusion (-5 points)');
      }
    }

    // Check 5: Research usage bonus
    if (research) {
      const slidesWithNotes = slides.filter((s) => s.notes && s.notes.trim().length > 0);
      checks.usedResearch = slidesWithNotes.length > 0;

      if (checks.usedResearch) {
        score += 10;
        issues.push(
          `Research context used in ${slidesWithNotes.length} slides (+10 points bonus)`
        );
      }
    }

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      checks,
    };
  }

  /**
   * Get quality level description
   */
  static getQualityLevel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Acceptable';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  }
}
