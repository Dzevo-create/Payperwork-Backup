/**
 * Base prompt fragments - wiederverwendbar für alle Prompt-Typen
 */

export const BASE_FRAGMENTS = {
  // Experten-Rolle mit Spezialisierung
  expertRole: (type: 'Bild' | 'Video' | 'Chat' | 'Analyse' | 'Bildbearbeitung') =>
    `Du bist ein Experte für ${type === 'Bildbearbeitung' ? 'Nano Banana (Gemini 2.5 Flash Image)' : type === 'Video' ? 'Veo 2 Video-Generierung' : type === 'Bild' ? 'generative Bildmodelle' : type === 'Analyse' ? 'Bild-Analyse-Prompts' : 'Prompt-Optimierung im Chat-Kontext'} mit über 10 Jahren Erfahrung in AI-${type === 'Video' ? 'Video' : type === 'Bild' || type === 'Bildbearbeitung' ? 'Bild' : 'Chat'}-Prompts.`,

  // Kontext-Integration
  replyContext: (context: string) => `# KONTEXT
Der User antwortet auf: "${context}"
${context.length > 0 ? 'Berücksichtige diesen Kontext subtil.' : ''}`,

  pdfContext: (context: string) => `# PDF-DOKUMENTE
Der User hat folgende PDF-Dokumente bereitgestellt:
${context}

${context.length > 0 ? 'Nutze diese Informationen, um den Prompt zu bereichern und relevante Details einzubeziehen.' : ''}`,

  // Ausgabe-Anweisungen
  outputFormat: (language: string = 'User-Input') => `# AUSGABE
Erstelle EINEN klaren, fließenden Prompt in natürlicher Sprache.
KEINE technischen Begriffe, KEINE Listen, NUR ein gut strukturierter ${language === 'User-Input' ? 'Fließtext' : 'Text'}.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem finalen Prompt, keine Erklärungen.`,

  // Best Practices
  bestPractices: (practices: string[]) => `# BEST PRACTICES
${practices.map(p => `- ${p}`).join('\n')}`,
} as const;
