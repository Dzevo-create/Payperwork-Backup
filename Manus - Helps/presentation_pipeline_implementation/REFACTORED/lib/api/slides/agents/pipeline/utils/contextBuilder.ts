/**
 * Context Builder Utility
 *
 * Builds research context for slides
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import type { ResearchServiceOutput, TopicWithResearch } from '../types';

export class ContextBuilder {
  /**
   * Build context for a specific slide from research
   */
  static buildSlideContext(
    topic: TopicWithResearch,
    research?: ResearchServiceOutput
  ): string | undefined {
    if (!research) return undefined;

    const relevantFindings = this.findRelevantFindings(topic, research);
    const relevantSources = this.findRelevantSources(topic, research);

    if (relevantFindings.length === 0 && relevantSources.length === 0) {
      return undefined;
    }

    return this.formatContext(relevantFindings, relevantSources);
  }

  /**
   * Find relevant findings for a topic
   */
  private static findRelevantFindings(
    topic: TopicWithResearch,
    research: ResearchServiceOutput
  ): string[] {
    const topicKeywords = [
      ...topic.title.toLowerCase().split(' '),
      ...topic.description.toLowerCase().split(' '),
    ].filter((word) => word.length > 3); // Filter out short words

    return research.keyFindings.filter((finding) => {
      const findingLower = finding.toLowerCase();
      return topicKeywords.some((keyword) => findingLower.includes(keyword));
    });
  }

  /**
   * Find relevant sources for a topic
   */
  private static findRelevantSources(
    topic: TopicWithResearch,
    research: ResearchServiceOutput
  ): Array<{ title: string; url: string }> {
    if (!topic.relevantSources) return [];

    return research.sources.filter((s) => topic.relevantSources?.includes(s.url));
  }

  /**
   * Format context string
   */
  private static formatContext(
    findings: string[],
    sources: Array<{ title: string; url: string }>
  ): string {
    let context = '';

    if (findings.length > 0) {
      context += 'Relevante Erkenntnisse:\n';
      context += findings.map((f) => `- ${f}`).join('\n');
      context += '\n\n';
    }

    if (sources.length > 0) {
      context += 'Quellen:\n';
      context += sources.map((s) => `- ${s.title} (${s.url})`).join('\n');
    }

    return context.trim();
  }
}
