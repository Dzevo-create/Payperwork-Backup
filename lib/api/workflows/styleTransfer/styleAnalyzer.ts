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
  windowStyle: string; // ✅ NEW: e.g., "Large floor-to-ceiling windows with thin black frames"
  facadeStructure: string; // ✅ NEW: e.g., "Vertical relief elements creating depth and shadow play"
  architecturalElements: string[]; // ✅ NEW: e.g., ["Rounded balcony edges", "Cantilevered overhangs", "Integrated sun shading"]
  proportions: string; // ✅ NEW: e.g., "High window-to-wall ratio with narrow vertical panels between windows"
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
    const analysisPrompt = `Analyze this architectural reference image and extract COMPREHENSIVE style information for accurate style transfer.

CRITICAL: This analysis is used to recreate architectural design elements. Be extremely detailed about BOTH materials AND structural/formal elements.

ANALYZE THE FOLLOWING:

1. MATERIALS
   - What building materials are visible? (wood, stone, metal, glass, concrete, brick, panels, etc.)
   - Be specific about material types (e.g., "vertical terracotta panels" not just "panels")
   - List 2-5 main materials

2. COLORS
   - What specific colors and tones are present?
   - Be descriptive (e.g., "warm orange-terracotta", "deep burgundy red", "natural oak tones")
   - List 3-6 main colors

3. TEXTURES
   - What surface textures are visible?
   - Be specific (e.g., "smooth painted panels", "rough stone texture", "ribbed metal cladding")
   - List 2-4 main textures

4. PATTERNS
   - What patterns or rhythms are present in the facade?
   - Examples: "vertical panels with rounded top edges", "horizontal window bands", "alternating solid and glass sections"
   - List 2-3 main patterns

5. FINISHES
   - What surface finishes are used?
   - Examples: "matte painted finish", "glossy lacquer", "weathered patina", "brushed metal"
   - List 2-4 main finishes

6. WINDOW STYLE (✅ NEW - CRITICAL!)
   - Describe the window design in detail
   - Include: size (floor-to-ceiling, punched openings, ribbon windows)
   - Include: frame type (thin black frames, deep reveals, frameless, colored frames)
   - Include: shape (rectangular, arched, rounded corners, custom shapes)
   - Include: arrangement (regular grid, irregular placement, grouped, single units)
   - Example: "Large rectangular windows with red frames, arranged in vertical columns with rounded panel elements above each window"

7. FACADE STRUCTURE (✅ NEW - CRITICAL!)
   - Describe the 3D structure and relief of the facade
   - Is it flat or does it have depth/relief?
   - Are there projecting elements (balconies, bays, fins)?
   - Are there recessed elements (loggias, reveals)?
   - Example: "Facade with strong vertical relief created by protruding orange panels between window columns, creating deep shadows and 3D effect"

8. ARCHITECTURAL ELEMENTS (✅ NEW - CRITICAL!)
   - List specific architectural features beyond basic materials
   - Examples: "Rounded balcony edges", "Cantilevered overhangs", "Integrated sun shading", "Decorative rounded panels above windows"
   - Include any unique design elements that define the building's character
   - List 2-5 distinctive elements

9. PROPORTIONS (✅ NEW - CRITICAL!)
   - Describe the window-to-wall ratio
   - Describe the vertical vs horizontal emphasis
   - Describe spacing and rhythm
   - Example: "High window coverage (60%) with narrow vertical panels between, creating strong vertical emphasis with 1:3 solid-to-void ratio"

10. OVERALL STYLE
    - Summarize the complete architectural style in one sentence
    - Include both material AND formal characteristics
    - Example: "Contemporary residential with orange terracotta panels, red window frames, and distinctive vertical relief structure with rounded decorative elements"

11. DETAILED DESCRIPTION
    - Write 3-4 sentences describing the COMPLETE architectural aesthetic
    - Include materials, colors, structure, windows, and special elements
    - Be extremely specific for AI image generation

RESPOND IN THIS EXACT JSON FORMAT:
{
  "materials": ["material1", "material2"],
  "colors": ["color1", "color2", "color3"],
  "textures": ["texture1", "texture2"],
  "patterns": ["pattern1", "pattern2"],
  "finishes": ["finish1", "finish2"],
  "windowStyle": "Detailed description of windows including size, frames, shape, and arrangement",
  "facadeStructure": "Detailed description of 3D facade structure, relief, depth, projections",
  "architecturalElements": ["element1", "element2", "element3"],
  "proportions": "Description of proportions, ratios, spacing, and rhythm",
  "overallStyle": "Complete style summary including materials AND formal elements",
  "detailedDescription": "Comprehensive 3-4 sentence description covering materials, structure, windows, and special features"
}

CRITICAL INSTRUCTIONS:
- Be EXTREMELY specific about window design - this is often the defining feature
- Describe 3D structure - flat vs relief facade makes huge difference
- List ALL distinctive architectural elements (rounded edges, cantilevers, etc.)
- Focus on what makes THIS building unique, not generic descriptions
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
      !styleDescription.windowStyle ||
      !styleDescription.facadeStructure ||
      !styleDescription.detailedDescription
    ) {
      apiLogger.error("[Style Analyzer] Invalid response structure", {
        styleDescription,
      });
      throw new Error("Invalid style analysis response structure - missing required fields");
    }

    apiLogger.info("[Style Analyzer] GPT-4o Vision analysis complete", {
      materialsCount: styleDescription.materials.length,
      colorsCount: styleDescription.colors.length,
      texturesCount: styleDescription.textures.length,
      hasWindowStyle: !!styleDescription.windowStyle,
      hasFacadeStructure: !!styleDescription.facadeStructure,
      architecturalElementsCount: styleDescription.architecturalElements?.length || 0,
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
    windowStyle:
      "Large rectangular windows with thin black frames arranged in a regular grid pattern",
    facadeStructure: "Flat facade with minimal relief, clean modern lines",
    architecturalElements: [
      "Clean horizontal floor plates",
      "Recessed balconies",
      "Simple window reveals",
    ],
    proportions:
      "Balanced window-to-wall ratio (approximately 40% glazing) with regular spacing and rhythm",
    overallStyle: "Contemporary residential with natural materials",
    detailedDescription:
      "Contemporary architectural design featuring natural wood cladding with warm brown tones and visible grain patterns. Clean lines with a mix of natural materials including wood, concrete, and glass creating a modern yet warm aesthetic. Large rectangular windows with black frames provide ample natural light while maintaining the minimalist design language.",
  };
}
