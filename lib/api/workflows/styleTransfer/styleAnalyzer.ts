/**
 * Style Analyzer for Style Transfer Workflow
 *
 * Analyzes reference images to extract detailed style information:
 * - Materials (wood, stone, metal, glass, etc.)
 * - Colors (specific tones and palettes)
 * - Textures (grain patterns, surface details)
 * - Patterns (vertical/horizontal lines, geometric)
 * - Finishes (matte, glossy, weathered)
 * - Overall architectural style
 *
 * ✅ NOW USES GPT-4o Vision (same as Source Image Analyzer) for consistent analysis!
 * Reference image is analyzed but NOT sent to generation model.
 */

import OpenAI from "openai";
import { apiLogger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface StyleDescription {
  materials: string[]; // e.g., ["vertical wood cladding", "natural stone base"]
  colors: string[]; // e.g., ["warm brown", "natural wood tones", "gray stone"]
  textures: string[]; // e.g., ["natural wood grain", "rough stone texture"]
  patterns: string[]; // e.g., ["vertical slats", "irregular stone pattern"]
  finishes: string[]; // e.g., ["matte wood finish", "weathered stone"]
  overallStyle: string; // e.g., "Modern residential with natural materials"
  detailedDescription: string; // 2-3 sentence detailed description
}

/**
 * Analyzes a reference image and extracts detailed style information
 *
 * ✅ Uses GPT-4o Vision (OpenAI) instead of Gemini Vision
 *
 * Analyzes:
 * 1. Architectural materials visible in the image
 * 2. Color palette and specific tones
 * 3. Texture types and surface qualities
 * 4. Patterns and rhythms (cladding, openings, etc.)
 * 5. Surface finishes and material treatments
 * 6. Overall architectural style and character
 *
 * @param imageData - Base64 encoded image data
 * @param mimeType - Image MIME type (e.g., "image/jpeg")
 * @returns StyleDescription object with extracted style information
 */
export async function analyzeReferenceImage(
  imageData: string,
  mimeType: string = "image/jpeg"
): Promise<StyleDescription> {
  apiLogger.info("[Style Analyzer] Starting reference image analysis with GPT-4o Vision");

  try {
    const analysisPrompt = `Analyze this architectural reference image and extract detailed style information for material transfer.

ANALYZE THE FOLLOWING:

1. MATERIALS
   - What building materials are visible? (wood, stone, metal, glass, concrete, brick, etc.)
   - Be specific about material types (e.g., "vertical wood cladding" not just "wood")
   - List 2-5 main materials

2. COLORS
   - What specific colors and tones are present?
   - Be descriptive (e.g., "warm brown", "charcoal gray", "natural oak tones")
   - List 3-6 main colors

3. TEXTURES
   - What surface textures are visible?
   - Be specific (e.g., "natural wood grain with visible knots", "smooth polished concrete")
   - List 2-4 main textures

4. PATTERNS
   - What patterns or rhythms are present in the facade?
   - Examples: "vertical wood slats with even spacing", "horizontal window bands", "staggered brick pattern"
   - List 1-3 main patterns

5. FINISHES
   - What surface finishes are used?
   - Examples: "matte natural finish", "glossy lacquer", "weathered patina", "brushed metal"
   - List 2-4 main finishes

6. OVERALL STYLE
   - Summarize the architectural style in one sentence
   - Examples: "Modern minimalist with natural materials", "Contemporary industrial aesthetic", "Traditional residential with wood accents"

7. DETAILED DESCRIPTION
   - Write 2-3 sentences describing the overall material aesthetic
   - Be specific and descriptive for use in AI prompt generation

RESPOND IN THIS EXACT JSON FORMAT:
{
  "materials": ["material1", "material2", "material3"],
  "colors": ["color1", "color2", "color3"],
  "textures": ["texture1", "texture2"],
  "patterns": ["pattern1", "pattern2"],
  "finishes": ["finish1", "finish2"],
  "overallStyle": "Brief style summary in one sentence",
  "detailedDescription": "Detailed 2-3 sentence description of materials and aesthetic"
}

IMPORTANT:
- Be specific and descriptive
- Focus on transferable material qualities
- Avoid mentioning specific building locations or contexts
- Describe what you SEE, not what you assume`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert architectural material analyst. Analyze images with precision and provide detailed, accurate style descriptions in JSON format.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.3, // Low temperature for consistent, factual analysis
    });

    const responseText = response.choices[0]?.message?.content || "";

    apiLogger.debug("[Style Analyzer] Raw GPT-4o Vision response", {
      responseLength: responseText.length,
      preview: responseText.substring(0, 200),
    });

    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch =
      responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      apiLogger.error("[Style Analyzer] Failed to parse JSON from response", {
        response: responseText.substring(0, 500),
      });
      throw new Error("Failed to parse style analysis response as JSON");
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const styleDescription: StyleDescription = JSON.parse(jsonString);

    // Validate response structure
    if (
      !styleDescription.materials ||
      !styleDescription.colors ||
      !styleDescription.detailedDescription
    ) {
      apiLogger.error("[Style Analyzer] Invalid response structure", {
        styleDescription,
      });
      throw new Error("Invalid style analysis response structure");
    }

    apiLogger.info("[Style Analyzer] GPT-4o Vision analysis complete", {
      materialsCount: styleDescription.materials.length,
      colorsCount: styleDescription.colors.length,
      texturesCount: styleDescription.textures.length,
      overallStyle: styleDescription.overallStyle,
    });

    return styleDescription;
  } catch (error) {
    apiLogger.error(
      "[Style Analyzer] Failed to analyze reference image with GPT-4o Vision",
      error instanceof Error ? error : undefined,
      {
        mimeType,
        imageDataLength: imageData.length,
      }
    );
    throw error;
  }
}

/**
 * Fallback style description when analysis fails
 * Provides generic but reasonable defaults
 */
export function getDefaultStyleDescription(): StyleDescription {
  return {
    materials: ["natural wood cladding", "glass windows", "concrete base"],
    colors: ["natural wood tones", "warm brown", "light gray concrete", "clear glass"],
    textures: ["natural wood grain", "smooth concrete surface", "reflective glass"],
    patterns: ["vertical wood slats", "regular window grid"],
    finishes: ["matte natural wood finish", "smooth concrete", "clear glass"],
    overallStyle: "Contemporary residential with natural materials",
    detailedDescription:
      "Contemporary architectural design featuring natural wood cladding with warm brown tones and visible grain patterns. Clean lines with a mix of natural materials including wood, concrete, and glass creating a modern yet warm aesthetic.",
  };
}
