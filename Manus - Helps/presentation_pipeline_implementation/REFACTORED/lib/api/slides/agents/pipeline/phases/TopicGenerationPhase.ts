/**
 * Topic Generation Phase
 *
 * Phase 2: Generate structured presentation outline
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { LLMTool } from '@/lib/agents/tools/LLMTool';
import { ProgressEmitter } from '../utils/progressEmitter';
import type {
  TopicGenerationPhaseResult,
  TopicWithResearch,
  PresentationPipelineInput,
  ResearchServiceOutput,
  ProgressCallback,
} from '../types';

export class TopicGenerationPhase {
  private llmTool: LLMTool;
  private progressEmitter: ProgressEmitter;

  constructor(onProgress?: ProgressCallback) {
    this.llmTool = new LLMTool();
    this.progressEmitter = new ProgressEmitter(onProgress);
  }

  /**
   * Execute topic generation phase
   */
  async execute(
    input: PresentationPipelineInput,
    research?: ResearchServiceOutput
  ): Promise<TopicGenerationPhaseResult> {
    const { topic, slideCount = 10 } = input;
    const startTime = Date.now();

    try {
      this.progressEmitter.phaseStarted('topic_generation', {
        topic,
        slideCount,
        hasResearch: !!research,
      });

      const prompt = this.buildPrompt(topic, slideCount, research);
      const topics = await this.llmTool.generateJSON<TopicWithResearch[]>(prompt);

      // Validate topics
      this.validateTopics(topics, slideCount);

      const duration = Date.now() - startTime;

      this.progressEmitter.phaseCompleted('topic_generation', {
        topicCount: topics.length,
        duration,
      });

      return {
        topics,
        duration,
      };
    } catch (error) {
      this.progressEmitter.phaseFailed(
        'topic_generation',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error(
        `Failed to generate topics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build prompt for topic generation
   */
  private buildPrompt(
    topic: string,
    slideCount: number,
    research?: ResearchServiceOutput
  ): string {
    if (research) {
      return `Du bist ein Präsentations-Experte. Erstelle genau ${slideCount} Folienthemen für eine Präsentation über: "${topic}"

RESEARCH SUMMARY:
${research.summary}

KEY FINDINGS:
${research.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

SOURCES:
${research.sources.map((s, i) => `${i + 1}. ${s.title} (${s.url})`).join('\n')}

Erstelle ${slideCount} Folienthemen basierend auf den Research-Ergebnissen.

Ausgabe NUR ein JSON-Array mit diesem exakten Format:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema",
    "keyPoints": ["Punkt aus Research 1", "Punkt aus Research 2"],
    "relevantSources": ["URL1", "URL2"]
  },
  ...
]

Regeln:
- Genau ${slideCount} Themen
- Erstes Thema muss "Einleitung" oder "Introduction" sein
- Letztes Thema muss "Fazit", "Zusammenfassung" oder "Conclusion" sein
- Jedes Thema sollte 2-4 keyPoints aus den Research-Findings haben
- relevantSources sollten URLs aus den Research-Quellen sein
- Ausgabe NUR das JSON-Array, kein anderer Text
- Alle Titel und Beschreibungen auf Deutsch`;
    }

    // Without research
    return `Du bist ein Präsentations-Experte. Erstelle genau ${slideCount} Folienthemen für eine Präsentation über: "${topic}"

Ausgabe NUR ein JSON-Array mit diesem exakten Format:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema",
    "keyPoints": ["Hauptpunkt 1", "Hauptpunkt 2"]
  },
  ...
]

Regeln:
- Genau ${slideCount} Themen
- Erstes Thema muss "Einleitung" sein
- Letztes Thema muss "Fazit" oder "Zusammenfassung" sein
- Ausgabe NUR das JSON-Array, kein anderer Text
- Alle Titel und Beschreibungen auf Deutsch`;
  }

  /**
   * Validate generated topics
   */
  private validateTopics(topics: any, expectedCount: number): void {
    if (!Array.isArray(topics)) {
      throw new Error('Topics must be an array');
    }

    if (topics.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} topics, got ${topics.length}`);
    }

    // Validate structure
    for (const topic of topics) {
      if (!topic.order || !topic.title || !topic.description || !topic.keyPoints) {
        throw new Error('Invalid topic structure');
      }
    }
  }
}
