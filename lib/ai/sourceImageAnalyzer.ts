/**
 * Source Image Analyzer
 *
 * Analyzes source images using GPT-4o Vision to extract:
 * - Architectural style and features
 * - Materials, colors, textures
 * - Structure and composition
 * - Lighting and atmosphere
 *
 * Used by workflows to DESCRIBE what IS in the image (Phase 1)
 * before applying TRANSFORMATION instructions (Phase 2)
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface SourceImageAnalysis {
  description: string;
  style: string;
  materials: string[];
  colors: string[];
  structure: string;
  lighting: string;
  details: string;
}

/**
 * Analyzes a source image to extract architectural and visual details
 *
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type (e.g., "image/jpeg")
 * @param workflow - Workflow context for specialized analysis
 * @returns Structured analysis of the source image
 */
export async function analyzeSourceImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  workflow: "style-transfer" | "branding" | "furnish-empty" | "sketch-to-render" = "style-transfer"
): Promise<SourceImageAnalysis> {
  try {
    console.log(`[SourceImageAnalyzer] Analyzing image for ${workflow}...`);

    // Workflow-specific analysis prompts
    const analysisPrompts = {
      "style-transfer": `Analyze this architectural image in detail. Describe:
1. **Current Style**: What architectural style is visible? (modern, minimalist, brutalist, etc.)
2. **Materials**: What materials can you see? (concrete, wood, glass, metal, etc.)
3. **Colors**: What are the dominant colors? Be specific (warm white, cool gray, natural wood tone, etc.)
4. **Structure**: Describe the geometric composition and forms
5. **Lighting**: Describe the lighting conditions (soft, harsh, daylight, artificial, etc.)
6. **Details**: Any notable architectural details or features

Be precise and descriptive. This will be used to transform the image while preserving its essence.`,

      branding: `Analyze this architectural image for branding transformation. Describe:
1. **Current Appearance**: What does the building/space look like now?
2. **Materials & Surfaces**: What materials and surfaces are visible?
3. **Colors**: Current color palette
4. **Branding Elements**: Any existing logos, colors, or branding visible?
5. **Structure**: Overall composition and layout
6. **Context**: Surrounding environment and setting

Focus on elements that will be transformed with brand identity.`,

      "furnish-empty": `Analyze this empty architectural space. Describe:
1. **Space Type**: What kind of space is this? (living room, office, bedroom, etc.)
2. **Architecture**: Wall colors, floor materials, ceiling height, windows
3. **Lighting**: Natural and artificial light sources
4. **Dimensions**: Approximate size and proportions
5. **Style Hints**: Any architectural details that suggest a style
6. **Atmosphere**: Overall mood and character of the space

This will be used to furnish the space appropriately.`,

      "sketch-to-render": `Analyze this architectural sketch. Describe:
1. **Design Intent**: What is the architectural concept?
2. **Geometry**: Describe the forms and shapes
3. **Style Indicators**: What architectural style is suggested?
4. **Details**: Notable design features or elements
5. **Context**: Setting and surroundings if visible
6. **Line Quality**: Sketch style (rough, detailed, technical, artistic)

This will be used to create a photorealistic rendering.`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert architectural analyst. Analyze images with precision and detail, focusing on visual characteristics that can be described and transformed.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompts[workflow],
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Low temperature for consistent, factual analysis
    });

    const analysisText = response.choices[0]?.message?.content || "";
    console.log(`[SourceImageAnalyzer] Analysis complete (${analysisText.length} chars)`);

    // Parse the analysis into structured format
    const parsed = parseAnalysis(analysisText);

    return {
      description: analysisText,
      style: parsed.style,
      materials: parsed.materials,
      colors: parsed.colors,
      structure: parsed.structure,
      lighting: parsed.lighting,
      details: parsed.details,
    };
  } catch (error) {
    console.error("[SourceImageAnalyzer] Error analyzing image:", error);

    // Return basic fallback analysis
    return {
      description: "Unable to analyze image. Using default description.",
      style: "contemporary",
      materials: ["concrete", "glass"],
      colors: ["neutral tones"],
      structure: "geometric composition",
      lighting: "natural daylight",
      details: "modern architectural elements",
    };
  }
}

/**
 * Parses unstructured analysis text into structured fields
 * Extracts key information for use in prompt generation
 */
function parseAnalysis(analysisText: string): {
  style: string;
  materials: string[];
  colors: string[];
  structure: string;
  lighting: string;
  details: string;
} {
  // Extract style (look for common architectural terms)
  const styleMatch = analysisText.match(/style[:\s]+([^\n.]+)/i);
  const style = styleMatch?.[1]?.trim() || "contemporary";

  // Extract materials (look for material keywords)
  const materialKeywords = [
    "concrete",
    "wood",
    "glass",
    "metal",
    "steel",
    "brick",
    "stone",
    "marble",
    "plaster",
    "ceramic",
    "fabric",
  ];
  const materials = materialKeywords.filter((keyword) =>
    analysisText.toLowerCase().includes(keyword)
  );

  // Extract colors (look for color mentions)
  const colorKeywords = [
    "white",
    "black",
    "gray",
    "grey",
    "beige",
    "brown",
    "blue",
    "green",
    "red",
    "yellow",
    "orange",
    "neutral",
    "warm",
    "cool",
  ];
  const colors = colorKeywords.filter((keyword) => analysisText.toLowerCase().includes(keyword));

  // Extract structure description
  const structureMatch =
    analysisText.match(/structure[:\s]+([^\n.]+)/i) ||
    analysisText.match(/composition[:\s]+([^\n.]+)/i);
  const structure = structureMatch?.[1]?.trim() || "geometric forms";

  // Extract lighting description
  const lightingMatch =
    analysisText.match(/lighting[:\s]+([^\n.]+)/i) || analysisText.match(/light[:\s]+([^\n.]+)/i);
  const lighting = lightingMatch?.[1]?.trim() || "natural daylight";

  // Extract details
  const detailsMatch =
    analysisText.match(/details[:\s]+([^\n.]+)/i) || analysisText.match(/features[:\s]+([^\n.]+)/i);
  const details = detailsMatch?.[1]?.trim() || "modern architectural elements";

  return {
    style,
    materials: materials.length > 0 ? materials : ["concrete", "glass"],
    colors: colors.length > 0 ? colors : ["neutral tones"],
    structure,
    lighting,
    details,
  };
}

/**
 * Formats analysis for use in prompt generation
 * Creates a concise description suitable for AI image generation
 */
export function formatAnalysisForPrompt(analysis: SourceImageAnalysis): string {
  return `Source image shows ${analysis.style} architecture with ${analysis.materials.join(", ")} materials in ${analysis.colors.join(", ")} tones. ${analysis.structure}. ${analysis.lighting} lighting. ${analysis.details}.`;
}
