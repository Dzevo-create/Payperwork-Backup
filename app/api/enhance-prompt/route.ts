import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Context detection: Determines the enhancement strategy
function detectContext(data: {
  mode?: string;
  hasImage: boolean;
  imageContext: string;
  replyContext: string;
  imageSettings?: any;
  videoContext?: string;
}): "nano_banana" | "image_generate" | "video_generate" | "chat" | "analyze" {
  const { mode, hasImage, imageContext, imageSettings: _imageSettings } = data;

  // Nano Banana: Image mode + attached image (editing existing image)
  if (mode === "image" && hasImage && imageContext) {
    return "nano_banana";
  }

  // Image Generation: Image mode without attached image (creating new image)
  if (mode === "image") {
    return "image_generate";
  }

  // Video Generation: Video mode
  if (mode === "video") {
    return "video_generate";
  }

  // Analyze: Has image but not in image mode (user wants to understand the image)
  if (hasImage && mode !== "image") {
    return "analyze";
  }

  // Default: Chat mode
  return "chat";
}

// Expert System Prompts
const EXPERT_PROMPTS = {
  nano_banana: (imageContext: string, imageSettings: any, replyContext: string, pdfContext?: string) => {
    let systemPrompt = `Du bist ein Experte für Nano Banana (Gemini 2.5 Flash Image) mit über 10 Jahren Erfahrung in AI-basierten Bildbearbeitungs-Prompts.

# DEINE AUFGABE
Der User hat ein Bild hochgeladen (beschrieben als: "${imageContext}") und möchte es verändern.
Du erstellst einen optimierten Prompt für Nano Banana, der:
1. Das Hauptobjekt/die Hauptszene aus dem Original-Bild BEIBEHÄLT
2. Die gewünschte Änderung präzise umsetzt
3. Nano Bananas Stärken nutzt: Objektkonsistenz, Stilübertragung, natürliche Übergänge

# NANO BANANA EXPERT TECHNIKEN
- Verwende klare Objektbeschreibungen: "Das [Objekt] soll..."
- Nutze räumliche Begriffe: "im Vordergrund", "im Hintergrund", "links/rechts"
- Beschreibe Beleuchtungsveränderungen präzise: "warmes goldenes Licht von rechts"
- Bei Stiländerungen: Nenne spezifische künstlerische Referenzen
- Verwende Komposition-Begriffe: "Fokus auf...", "Schärfentiefe"
- Betone Kontinuität: "Behalte die Struktur des Originals bei"`;

    // Add image settings context
    if (imageSettings) {
      systemPrompt += `\n\n# BILD-EINSTELLUNGEN (User-Vorgaben)`;

      if (imageSettings.style) {
        const styleGuides: Record<string, string> = {
          photorealistic: "Fotorealistisch: Verwende präzise Beleuchtung, Materialdetails und natürliche Texturen",
          cinematic: "Cinematisch: Filmische Beleuchtung, dramatische Schatten, Tiefenschärfe, Color Grading",
          artistic: "Künstlerisch: Expressiver Stil, kreative Freiheiten, künstlerische Interpretation",
          anime: "Anime-Stil: Klare Linien, lebendige Farben, stilisierte Formen",
          "3d_render": "3D-Render: Perfekte Geometrie, saubere Oberflächen, kontrollierte Beleuchtung"
        };
        systemPrompt += `\n- Stil: ${styleGuides[imageSettings.style] || imageSettings.style}`;
      }

      if (imageSettings.lighting) {
        const lightingGuides: Record<string, string> = {
          natural: "Natürliche Beleuchtung: Tageslicht, weiche Schatten, realistische Lichtverteilung",
          studio: "Studio-Beleuchtung: Kontrolliert, gleichmäßig, professionell ausgeleuchtet",
          dramatic: "Dramatische Beleuchtung: Starke Kontraste, gezielte Schatten, Chiaroscuro",
          golden_hour: "Golden Hour: Warmes, weiches Licht während Sonnenaufgang/-untergang",
          neon: "Neon-Beleuchtung: Lebendige Farben, künstliches Licht, urbane Atmosphäre",
          soft: "Weiches Licht: Diffus, schmeichelhaft, minimale Schatten"
        };
        systemPrompt += `\n- Beleuchtung: ${lightingGuides[imageSettings.lighting] || imageSettings.lighting}`;
      }

      if (imageSettings.quality) {
        const qualityGuides: Record<string, string> = {
          ultra: "Ultra-Qualität: Maximale Details, perfekte Schärfe, hochauflösend",
          high: "Hohe Qualität: Sehr detailliert, professionelles Niveau",
          standard: "Standard-Qualität: Ausgeglichen zwischen Details und Verarbeitung"
        };
        systemPrompt += `\n- Qualität: ${qualityGuides[imageSettings.quality]}`;
      }

      if (imageSettings.aspectRatio) {
        const aspectGuides: Record<string, string> = {
          "1:1": "Quadratisch - ausgewogene Komposition",
          "16:9": "Breitbild - filmische Komposition",
          "9:16": "Portrait - vertikale Komposition für Porträts/Stories",
          "4:3": "Klassisch - traditionelles Fotoformat",
          "3:2": "Foto - natürliches DSLR-Format",
          "21:9": "Ultrawide - sehr filmisch, panoramisch"
        };
        systemPrompt += `\n- Format: ${aspectGuides[imageSettings.aspectRatio] || imageSettings.aspectRatio}`;
      }

      systemPrompt += `\n\nINTEGRIERE diese Vorgaben natürlich in den Prompt.`;
    }

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT
Der User antwortet auf: "${replyContext}"
Berücksichtige diesen Kontext subtil.`;
    }

    if (pdfContext) {
      systemPrompt += `\n\n# PDF-DOKUMENTE
Der User hat folgende PDF-Dokumente bereitgestellt:
${pdfContext}

Nutze diese Informationen, um den Prompt zu bereichern und relevante Details einzubeziehen.`;
    }

    systemPrompt += `\n\n# AUSGABE
Erstelle EINEN klaren, fließenden Prompt in natürlicher Sprache.
KEINE technischen Begriffe, KEINE Listen, NUR ein gut strukturierter Fließtext.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem finalen Prompt, keine Erklärungen.`;

    return systemPrompt;
  },

  image_generate: (imageSettings: any, replyContext: string, pdfContext?: string) => {
    let systemPrompt = `Du bist ein Experte für generative Bildmodelle mit über 10 Jahren Erfahrung in AI-Bildgenerierungs-Prompts.

# DEINE AUFGABE
Der User möchte ein NEUES Bild erstellen (kein bestehendes Bild bearbeiten).
Erstelle einen detaillierten, präzisen Prompt der alle wichtigen visuellen Aspekte beschreibt:
- Hauptmotiv und Objekte
- Komposition und Perspektive
- Beleuchtung und Atmosphäre
- Farben und Stimmung
- Stil und künstlerische Richtung
- Details und Texturen`;

    // Add image settings context
    if (imageSettings) {
      systemPrompt += `\n\n# BILD-EINSTELLUNGEN (User-Vorgaben)`;

      if (imageSettings.preset && imageSettings.preset !== "none") {
        const presetGuides: Record<string, string> = {
          cinematic: "Filmische Ästhetik: Dramatische Beleuchtung, Tiefenschärfe, Color Grading im Filmstil",
          portrait: "Portrait-Fokus: Schmeichelnde Beleuchtung, Fokus auf Gesicht/Person, professionelle Porträtästhetik",
          landscape: "Landschafts-Fokus: Weite Perspektive, natürliche Schönheit, panoramische Komposition",
          product: "Produktfotografie: Sauberer Hintergrund, perfekte Beleuchtung, Fokus auf Details",
          artistic: "Künstlerische Interpretation: Kreative Freiheit, expressiver Stil, einzigartiger Look",
          night: "Nachtszene: Künstliche Lichtquellen, urbane Atmosphäre, kontrastreiche Beleuchtung"
        };
        systemPrompt += `\n- Preset: ${presetGuides[imageSettings.preset] || imageSettings.preset}`;
      }

      if (imageSettings.style) {
        const styleGuides: Record<string, string> = {
          photorealistic: "Fotorealistisch: Wie ein echtes Foto - natürliche Beleuchtung, realistische Texturen, authentische Details",
          cinematic: "Cinematisch: Wie ein Filmstill - professionelles Color Grading, dramatische Beleuchtung, Tiefenschärfe",
          artistic: "Künstlerisch: Kreative Interpretation, malerischer Stil, künstlerische Freiheiten",
          anime: "Anime-Stil: Japanische Animation - klare Linien, lebendige Farben, stilisierte Features",
          "3d_render": "3D-Render: Computergeneriert - perfekte Geometrie, saubere Oberflächen, hochglänzende Materialien"
        };
        systemPrompt += `\n- Stil: ${styleGuides[imageSettings.style]}`;
      }

      if (imageSettings.lighting) {
        const lightingGuides: Record<string, string> = {
          natural: "Natürlich: Tageslicht, Fensterbeleuchtung, weiche Schatten",
          studio: "Studio: Professionelle Beleuchtungs-Setups, Softboxen, gleichmäßige Ausleuchtung",
          dramatic: "Dramatisch: Starke Kontraste, gezielte Schatten, Chiaroscuro-Technik",
          golden_hour: "Golden Hour: Warmes, goldenes Licht kurz nach Sonnenaufgang oder vor Sonnenuntergang",
          neon: "Neon: Bunte Neonlichter, künstliche Lichtquellen, urbane Nacht-Atmosphäre",
          soft: "Weich: Diffuses, schmeichelndes Licht mit minimalen Schatten"
        };
        systemPrompt += `\n- Beleuchtung: ${lightingGuides[imageSettings.lighting]}`;
      }

      if (imageSettings.quality) {
        systemPrompt += `\n- Qualität: ${imageSettings.quality === "ultra" ? "Ultra-hochauflösend, maximale Details" : imageSettings.quality === "high" ? "Hohe Details" : "Standard-Details"}`;
      }

      if (imageSettings.aspectRatio) {
        const aspectGuides: Record<string, string> = {
          "1:1": "Quadratisch (1:1) - Zentrierte, ausgewogene Komposition",
          "16:9": "Breitbild (16:9) - Filmische, horizontale Komposition",
          "9:16": "Portrait (9:16) - Vertikale Komposition, ideal für Porträts",
          "4:3": "Klassisch (4:3) - Traditionelles TV/Foto-Format",
          "3:2": "DSLR (3:2) - Natürliches Kamera-Format",
          "21:9": "Ultrawide (21:9) - Sehr filmisch, panoramisch"
        };
        systemPrompt += `\n- Format: ${aspectGuides[imageSettings.aspectRatio]}`;
      }

      systemPrompt += `\n\nINTEGRIERE alle Vorgaben natürlich und fließend in den Prompt.`;
    }

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT
Der User antwortet auf: "${replyContext}"
Nutze diesen Kontext, um den Prompt anzupassen.`;
    }

    systemPrompt += `\n\n# BEST PRACTICES
- Beschreibe die Szene visuell und detailliert
- Nutze präzise, beschreibende Adjektive
- Erwähne Komposition und Perspektive
- Definiere Atmosphäre und Mood
- Sei spezifisch bei Farben und Materialien`;

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT\nDer User antwortet auf: "${replyContext}"\nBerücksichtige diesen Kontext.`;
    }

    if (pdfContext) {
      systemPrompt += `\n\n# PDF-DOKUMENTE\nDer User hat folgende PDF-Dokumente bereitgestellt:\n${pdfContext}\n\nNutze diese Informationen, um ein passendes Bild zu beschreiben.`;
    }

    systemPrompt += `\n\n# AUSGABE
Erstelle EINEN detaillierten, fließenden Prompt in natürlicher Sprache.
KEINE technischen Begriffe oder Listen, NUR ein gut strukturierter beschreibender Text.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem finalen Prompt, keine Erklärungen.`;

    return systemPrompt;
  },

  video_generate: (videoContext: string, replyContext: string, pdfContext?: string) => {
    let systemPrompt = `Du bist ein Experte für Veo 2 Video-Generierung mit über 10 Jahren Erfahrung in AI-Video-Prompts.

# DEINE AUFGABE
Der User möchte ein Video mit Veo 2 erstellen.
Erstelle einen optimierten Video-Prompt der folgende Aspekte beschreibt:
- Die Hauptszene und Aktion
- Bewegung und Dynamik
- Kamerabewegung (falls vorhanden)
- Visuelle Atmosphäre
- Beleuchtung und Stimmung
- Zeitlicher Ablauf (Anfang → Ende)`;

    if (videoContext) {
      systemPrompt += `\n\n# VIDEO-EINSTELLUNGEN\n${videoContext}`;

      // Extract and provide specific guidance for camera movement
      const cameraMovement = videoContext.match(/Kamera: (.+)/)?.[1];
      if (cameraMovement && cameraMovement !== "none" && !cameraMovement.includes("Keine")) {
        systemPrompt += `\n\nKRITISCH: Die Kamerabewegung MUSS natürlich in den Prompt integriert werden.`;
        if (cameraMovement.includes("forward_up") || cameraMovement.includes("Vorwärts")) {
          systemPrompt += ` Beschreibe, wie die Kamera sich vorwärts bewegt und nach oben neigt, um mehr vom Himmel/der Umgebung zu enthüllen.`;
        } else if (cameraMovement.includes("down_back") || cameraMovement.includes("Abwärts")) {
          systemPrompt += ` Beschreibe, wie die Kamera sich abwärts und zurück bewegt, um Tiefe zu zeigen.`;
        } else if (cameraMovement.includes("right_turn") || cameraMovement.includes("Rechts")) {
          systemPrompt += ` Beschreibe, wie die Kamera sich nach rechts dreht während sie vorwärts fährt.`;
        } else if (cameraMovement.includes("left_turn") || cameraMovement.includes("Links")) {
          systemPrompt += ` Beschreibe, wie die Kamera sich nach links dreht während sie vorwärts fährt.`;
        }
      }

      const duration = videoContext.match(/(\d+) Sekunden/)?.[1];
      if (duration === "5") {
        systemPrompt += `\n\nDas Video ist kurz (5 Sekunden). Fokussiere auf eine einzelne, klare Aktion oder Bewegung.`;
      } else {
        systemPrompt += `\n\nDas Video ist länger (10 Sekunden). Du kannst eine komplexere Sequenz oder mehrere Aktionen beschreiben.`;
      }
    }

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT
Der User antwortet auf: "${replyContext}"
Nutze diesen Kontext für die Video-Erstellung.`;
    }

    systemPrompt += `\n\n# VEO 2 BEST PRACTICES
- Beschreibe die Aktion klar und dynamisch
- Nutze temporale Begriffe: "beginnt mit...", "während...", "endet mit..."
- Integriere Kamerabewegung natürlich in die Szene
- Beschreibe visuelle Details: Beleuchtung, Farben, Atmosphäre
- Halte die Beschreibung kohärent und fokussiert`;

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT\nDer User antwortet auf: "${replyContext}"\nBerücksichtige diesen Kontext.`;
    }

    if (pdfContext) {
      systemPrompt += `\n\n# PDF-DOKUMENTE\nDer User hat folgende PDF-Dokumente bereitgestellt:\n${pdfContext}\n\nNutze diese Informationen für das Video-Konzept.`;
    }

    systemPrompt += `\n\n# AUSGABE
Erstelle EINEN fließenden Video-Prompt in natürlicher Sprache.
KEINE technischen Begriffe, KEINE Listen, NUR eine klare narrative Beschreibung.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem finalen Prompt, keine Erklärungen.`;

    return systemPrompt;
  },

  chat: (replyContext: string, pdfContext?: string) => {
    let systemPrompt = `Du bist ein Experte für Prompt-Optimierung im Chat-Kontext.

# DEINE AUFGABE
Der User möchte mit einem Chat-Modell kommunizieren.
Verbessere den Prompt, um ihn:
- Klarer und präziser zu machen
- Mit relevantem Kontext anzureichern
- Strukturierter zu formulieren
- Effektiver für die gewünschte Antwort`;

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT
Der User antwortet auf: "${replyContext}"
Nutze diesen Kontext, um den Prompt besser zu verstehen und anzupassen.`;
    }

    if (pdfContext) {
      systemPrompt += `\n\n# PDF-DOKUMENTE\nDer User hat folgende PDF-Dokumente bereitgestellt:\n${pdfContext}\n\nBerücksichtige diese Informationen beim Verbessern des Prompts.`;
    }

    systemPrompt += `\n\n# BEST PRACTICES
- Formuliere die Frage/Aufgabe klar und direkt
- Füge wichtige Details hinzu, die fehlen könnten
- Strukturiere komplexe Anfragen
- Behalte die ursprüngliche Intention bei

# AUSGABE
Erstelle einen verbesserten Chat-Prompt.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem verbesserten Prompt, keine Erklärungen.`;

    return systemPrompt;
  },

  analyze: (imageContext: string, replyContext: string, pdfContext?: string) => {
    let systemPrompt = `Du bist ein Experte für Bild-Analyse-Prompts.

# DEINE AUFGABE
Der User hat ein Bild hochgeladen (beschrieben als: "${imageContext}") und möchte etwas darüber erfahren.
Erstelle einen klaren Analyse-Prompt, der:
- Die gewünschte Information spezifiziert
- Den Kontext des Bildes berücksichtigt
- Präzise Fragen stellt`;

    if (replyContext) {
      systemPrompt += `\n\n# KONTEXT
Der User antwortet auf: "${replyContext}"`;
    }

    if (pdfContext) {
      systemPrompt += `\n\n# PDF-DOKUMENTE\nDer User hat folgende PDF-Dokumente bereitgestellt:\n${pdfContext}\n\nIntegriere diese Informationen in die Bild-Analyse.`;
    }

    systemPrompt += `\n\n# AUSGABE
Erstelle einen klaren Analyse-Prompt.
Verwende dieselbe Sprache wie der User-Input.
Antworte NUR mit dem finalen Prompt, keine Erklärungen.`;

    return systemPrompt;
  },
};

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(['openai']);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'enhance-prompt-api'
      );
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const {
      prompt,
      mode,
      hasImage,
      imageContext,
      replyContext,
      pdfContext,
      videoContext,
      imageSettings,
    } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    // Detect context
    const context = detectContext({
      mode,
      hasImage: hasImage || false,
      imageContext: imageContext || "",
      replyContext: replyContext || "",
      imageSettings,
      videoContext,
    });

    console.log("🎯 Context detected:", context);
    console.log("📝 Original prompt:", prompt);
    if (imageSettings) {
      console.log("🎨 Image settings:", imageSettings);
    }

    // Get appropriate system prompt based on context
    let systemPrompt: string;
    switch (context) {
      case "nano_banana":
        systemPrompt = EXPERT_PROMPTS.nano_banana(
          imageContext || "",
          imageSettings,
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "image_generate":
        systemPrompt = EXPERT_PROMPTS.image_generate(
          imageSettings,
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "video_generate":
        systemPrompt = EXPERT_PROMPTS.video_generate(
          videoContext || "",
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "analyze":
        systemPrompt = EXPERT_PROMPTS.analyze(
          imageContext || "",
          replyContext || "",
          pdfContext || undefined
        );
        break;
      default:
        systemPrompt = EXPERT_PROMPTS.chat(replyContext || "", pdfContext || undefined);
    }

    // Use OpenAI to enhance the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      throw new Error("No enhanced prompt generated");
    }

    console.log("✅ Enhanced prompt:", enhancedPrompt);

    return NextResponse.json({ enhancedPrompt });
  } catch (error: any) {
    return handleApiError(error, 'enhance-prompt-api');
  }
}
