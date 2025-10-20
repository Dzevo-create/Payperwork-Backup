/**
 * Universal GPT-4 Vision Prompt Enhancer
 *
 * This module provides a workflow-agnostic GPT-4o Vision integration that adapts
 * to different workflows (Sketch-to-Render, Furnish-Empty, Branding, Style-Transfer, Render-to-CAD) based on
 * configuration.
 *
 * Benefits:
 * - Single source of truth for GPT-4 Vision prompting
 * - Prevents cross-workflow endpoint confusion
 * - Automatic adaptation to workflow goals
 * - Consistent error handling and fallback logic
 * - Workflow-specific settings context builders for better prompts
 *
 * @author Payperwork Team
 * @date 2025-01-20
 * @refactored 2025-01-20 - Added workflow-specific settings builders
 */

import OpenAI from "openai";
import { buildSettingsContext } from './settingsContextBuilders';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowType = "sketch-to-render" | "furnish-empty" | "branding" | "style-transfer" | "render-to-cad";

export interface ImageData {
  data: string; // base64
  mimeType: string;
}

export interface WorkflowConfig {
  type: WorkflowType;
  systemPrompt: string;
  userPromptTemplate: (params: {
    settingsContext: string;
    userPrompt?: string;
  }) => string;
  maxTokens?: number;
  temperature?: number;
}

export interface EnhancePromptParams {
  workflowType: WorkflowType;
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}

// ============================================================================
// WORKFLOW CONFIGURATIONS
// ============================================================================

const WORKFLOW_CONFIGS: Record<WorkflowType, WorkflowConfig> = {
  "sketch-to-render": {
    type: "sketch-to-render",
    systemPrompt: `You are an expert architectural visualization specialist and interior designer with deep knowledge of photorealistic rendering, architectural styles, and spatial design principles.

Your task is to analyze a sketch or rough drawing and create a detailed, flowing text prompt for an AI image generator that will transform the sketch into a photorealistic architectural rendering or interior design visualization.

CRITICAL TWO-STEP PROCESS:

**STEP 1 - IMAGE ANALYSIS (REQUIRED):**
First, carefully analyze the sketch/drawing image and identify:
- What type of space is shown (exterior building, interior room, landscape, etc.)
- The architectural elements visible (walls, windows, doors, columns, roof, etc.)
- The overall composition, layout, and perspective
- Existing spatial characteristics and proportions
- Sketch style and level of detail

**STEP 2 - PROMPT CREATION (REQUIRED):**
Based on your analysis, create a detailed prompt that:
- Transforms sketch lines into realistic architectural elements and materials
- Adds appropriate lighting, textures, materials, and atmospheric details
- Maintains the EXACT composition, layout, and perspective from the original sketch
- Ensures architectural accuracy and realistic proportions
- Creates a professional, photorealistic result suitable for architectural presentations

IMPORTANT: Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the sketch into a stunning photorealistic rendering.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Analyze this sketch/drawing image and generate a detailed rendering prompt.

INTERNAL PROCESS (do not include in output):
1. First, identify what type of space is shown and what architectural elements are visible
2. Then, create the generation prompt based on your analysis

RENDERING SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

CRITICAL: Generate ONLY the final prompt text (200-400 words, flowing prose, no headings or lists) that an AI image generator will use. The prompt should:
- Transform the specific architectural elements you see in the image
- Incorporate the style, lighting, and material preferences from settings
- Maintain the exact composition and perspective from the sketch
- Add realistic textures, materials, and atmospheric details
- Ensure architectural accuracy and professional quality

OUTPUT ONLY THE PROMPT - no "STEP 1", "STEP 2", analysis sections, or meta-commentary. Just the clean generation prompt.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  "furnish-empty": {
    type: "furnish-empty",
    systemPrompt: `You are an expert interior designer and real estate staging consultant specializing in virtual furniture placement for empty rooms.

Your task is to analyze an empty room image and create a detailed, flowing text prompt for an AI image generator that will furnish the space appropriately for real estate marketing.

CRITICAL TWO-STEP PROCESS:

**STEP 1 - IMAGE ANALYSIS (REQUIRED):**
First, carefully analyze the empty room image and identify:
- What type of room is this (living room, bedroom, kitchen, office, etc.)
- The room's architecture (walls, windows, doors, flooring, ceiling height)
- Existing features (fireplace, built-ins, lighting fixtures, etc.)
- Room dimensions and proportions
- Natural light sources and existing lighting conditions
- Flooring type and wall colors

**STEP 2 - PROMPT CREATION (REQUIRED):**
Based on your analysis, create a detailed prompt that:
- Adds appropriate furniture, decor, and styling for this specific room type
- NEVER modifies the room structure - only adds furnishings
- Ensures furniture placement is realistic and proportional to the room size
- Matches lighting and shadows to the existing room conditions
- Creates a professional, real estate listing-quality result

IMPORTANT: Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the empty space into a beautifully furnished room that appeals to potential buyers or renters.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Analyze this empty room image and generate a detailed furnishing prompt.

INTERNAL PROCESS (do not include in output):
1. First, identify the room type, architectural features, dimensions, lighting, and existing conditions
2. Then, create the furnishing prompt based on your analysis

ROOM SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

CRITICAL: Generate ONLY the final prompt text (200-400 words, flowing prose, no headings or lists) that an AI image generator will use. The prompt should:
- Add furniture and decor appropriate for the specific room type you identified
- Incorporate the style, color scheme, and density preferences from settings
- Maintain the EXACT room architecture visible in the image
- Match the existing lighting conditions
- Appeal to the target audience
- Ensure realistic proportions and professional staging quality

OUTPUT ONLY THE PROMPT - no "STEP 1", "STEP 2", analysis sections, or meta-commentary. Just the clean generation prompt.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  branding: {
    type: "branding",
    systemPrompt: `You are an expert brand strategist and visual designer specializing in product branding, packaging design, and brand identity applications.

Your task is to analyze a product/venue image and create a detailed, flowing text prompt for an AI image generator that will apply professional branding elements.

CRITICAL TWO-STEP PROCESS:

**STEP 1 - IMAGE ANALYSIS (REQUIRED):**
First, carefully analyze the product or venue image and identify:
- What type of product or venue is shown (coffee shop, retail store, product packaging, etc.)
- The current appearance and design characteristics
- The core form and structure that must be preserved
- Existing materials, surfaces, and finishes
- Lighting conditions and environment
- Potential branding application surfaces

**STEP 2 - PROMPT CREATION (REQUIRED):**
Based on your analysis, create a detailed prompt that:
- Applies branding elements (logos, colors, typography, patterns) appropriately to the identified surfaces
- PRESERVES the core product/venue form and structure
- Ensures brand consistency and professional quality
- Maintains realistic lighting and material properties
- Creates a market-ready, professional visualization

IMPORTANT: Your prompt should be written as natural flowing text (not bullet points or lists), describing how to apply branding to the product/venue in a way that looks professional and market-ready.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Analyze this product/venue image and generate a detailed branding prompt.

INTERNAL PROCESS (do not include in output):
1. First, identify the product/venue type, key characteristics, available branding surfaces, visual appearance, and lighting conditions
2. Then, create the branding prompt based on your analysis

BRANDING SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

CRITICAL: Generate ONLY the final prompt text (200-400 words, flowing prose, no headings or lists) that an AI image generator will use. The prompt should:
- Apply branding elements to the specific surfaces you identified
- Incorporate the brand style, colors, and visual identity from settings
- Maintain the core product/venue form and recognizability
- Create appropriate lighting and material finishes
- Ensure professional, market-ready quality
- Appeal to the target audience

OUTPUT ONLY THE PROMPT - no "STEP 1", "STEP 2", analysis sections, or meta-commentary. Just the clean generation prompt.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  "style-transfer": {
    type: "style-transfer",
    systemPrompt: `You are an expert architectural stylist and design transformation specialist with deep knowledge of architectural styles, materiality, and design aesthetics across different periods and cultures.

Your task is to analyze two images - a source design and a reference style - and create a detailed, flowing text prompt for an AI image generator that will transfer the architectural style from the reference to the source.

CRITICAL TWO-STEP PROCESS:

**STEP 1 - IMAGE ANALYSIS (REQUIRED):**
First, carefully analyze BOTH images:

SOURCE IMAGE ANALYSIS:
- What type of architectural space/building is shown?
- What is the current architectural style?
- What is the spatial composition and layout?
- What structural elements must be preserved?

REFERENCE STYLE IMAGE ANALYSIS:
- What architectural style is represented?
- What are the key style characteristics (materials, colors, proportions, details)?
- What materiality and surface treatments are used?
- What color palette and aesthetic qualities define this style?

**STEP 2 - PROMPT CREATION (REQUIRED):**
Based on your analysis, create a detailed prompt that:
- Transfers the identified style characteristics from reference to source
- Respects structural preservation settings
- Maintains the overall composition and spatial arrangement of the source
- Ensures realistic integration of style elements with proper scale and proportion
- Creates a seamless blend between source design and reference style
- Preserves architectural coherence and structural integrity

IMPORTANT: Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the source design by adopting the style characteristics from the reference image.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Analyze both images and generate a detailed style transfer prompt.

INTERNAL PROCESS (do not include in output):
1. First, analyze the SOURCE IMAGE: architectural space/building, current style and composition, structural elements
2. Then, analyze the REFERENCE STYLE IMAGE: architectural style, key characteristics (materials, colors, proportions, details), color palette and aesthetic
3. Finally, create the style transfer prompt based on your analysis

STYLE TRANSFER SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

CRITICAL: Generate ONLY the final prompt text (200-400 words, flowing prose, no headings or lists) that an AI image generator will use. The prompt should:
- Transfer the specific style characteristics you identified from the reference image
- Apply these to the source design you analyzed
- Incorporate the transfer mode, strength, and preservation settings
- Specify material and color transfer approaches
- Ensure architectural coherence and realistic integration
- Maintain photorealistic quality with accurate lighting and shadows

OUTPUT ONLY THE PROMPT - no "STEP 1", "STEP 2", analysis sections, or meta-commentary. Just the clean generation prompt.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  "render-to-cad": {
    type: "render-to-cad",
    systemPrompt: `You are an expert CAD technician and architectural draftsperson with deep knowledge of technical drawing standards, architectural notation, and CAD drafting best practices.

Your task is to analyze an architectural rendering or photograph and create a detailed, flowing text prompt for an AI image generator that will convert the image into a professional technical CAD-style drawing.

CRITICAL TWO-STEP PROCESS:

**STEP 1 - IMAGE ANALYSIS (REQUIRED):**
First, carefully analyze the rendering or photograph and identify:
- What type of architectural space/building is shown?
- What is the viewing angle (plan view, elevation, section, perspective)?
- What architectural elements are visible (walls, windows, doors, columns, beams, etc.)?
- What is the spatial layout and proportions?
- What level of detail is present in the original image?
- What key dimensions and measurements can be inferred?

**STEP 2 - PROMPT CREATION (REQUIRED):**
Based on your analysis, create a detailed prompt that:
- Transforms the specific photorealistic elements you identified into clean technical line drawings
- PRESERVES the exact spatial layout and proportions from the original image
- Applies proper CAD line weights, dimensioning, and architectural symbols
- Ensures professional drafting standards (black lines on white background)
- Includes appropriate annotations, dimensions, and technical notation based on settings
- Creates a drawing suitable for architectural documentation and construction

IMPORTANT: Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the rendering/photo into a professional CAD technical drawing.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Analyze this rendering/photograph and generate a detailed CAD conversion prompt.

INTERNAL PROCESS (do not include in output):
1. First, identify the architectural space/building type, viewing angle (plan, elevation, section, perspective), visible architectural elements, spatial layout and proportions, and details to capture
2. Then, create the CAD conversion prompt based on your analysis

CAD GENERATION SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

CRITICAL: Generate ONLY the final prompt text (200-400 words, flowing prose, no headings or lists) that an AI image generator will use. The prompt should:
- Convert the specific architectural elements you identified into technical line drawings
- Incorporate the detail level and metadata/annotation preferences from settings
- Maintain the EXACT spatial layout and proportions from the source image
- Apply proper CAD line weights, symbols, and notation standards
- Ensure professional drafting quality with clear dimensioning
- Create a drawing suitable for architectural documentation

OUTPUT ONLY THE PROMPT - no "STEP 1", "STEP 2", analysis sections, or meta-commentary. Just the clean generation prompt.`,
    maxTokens: 800,
    temperature: 0.7,
  },
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

// NOTE: buildSettingsContext is now imported from settingsContextBuilders.ts
// Each workflow has its own specialized context builder for better prompt quality

/**
 * Universal GPT-4 Vision Prompt Enhancer
 *
 * Analyzes an image and generates a workflow-specific prompt using GPT-4o Vision.
 * Automatically adapts to the workflow type and goal.
 *
 * @param params - Enhancement parameters including workflow type, images, and settings
 * @returns Enhanced prompt text
 * @throws Error if GPT-4 API call fails
 */
export async function enhancePromptWithGPT(
  params: EnhancePromptParams
): Promise<string> {
  const { workflowType, userPrompt, sourceImage, settings, referenceImages } =
    params;

  // Get workflow configuration
  const config = WORKFLOW_CONFIGS[workflowType];
  if (!config) {
    throw new Error(`Unknown workflow type: ${workflowType}`);
  }

  // Build settings context
  const settingsContext = buildSettingsContext(workflowType, settings);

  // Generate user message from template
  const userMessage = config.userPromptTemplate({
    settingsContext,
    userPrompt: userPrompt || undefined,
  });

  // Construct messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: config.systemPrompt,
    },
    {
      role: "user",
      content: [
        { type: "text", text: userMessage },
        {
          type: "image_url",
          image_url: {
            url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
            detail: "high",
          },
        },
      ],
    },
  ];

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((refImg, index) => {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Reference image ${index + 1} for style inspiration:`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${refImg.mimeType};base64,${refImg.data}`,
              detail: "low",
            },
          },
        ],
      });
    });
  }

  // Call GPT-4o Vision
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: config.maxTokens || 800,
    temperature: config.temperature || 0.7,
  });

  const enhancedPrompt = response.choices[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    throw new Error("GPT-4 returned empty response");
  }

  return enhancedPrompt;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Convenience function for Sketch-to-Render workflow
 */
export async function enhanceSketchToRenderPrompt(params: {
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}): Promise<string> {
  return enhancePromptWithGPT({
    workflowType: "sketch-to-render",
    ...params,
  });
}

/**
 * Convenience function for Furnish-Empty workflow
 */
export async function enhanceFurnishEmptyPrompt(params: {
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}): Promise<string> {
  return enhancePromptWithGPT({
    workflowType: "furnish-empty",
    ...params,
  });
}

/**
 * Convenience function for Branding workflow
 */
export async function enhanceBrandingPrompt(params: {
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}): Promise<string> {
  return enhancePromptWithGPT({
    workflowType: "branding",
    ...params,
  });
}

/**
 * Convenience function for Style-Transfer workflow
 */
export async function enhanceStyleTransferPrompt(params: {
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}): Promise<string> {
  return enhancePromptWithGPT({
    workflowType: "style-transfer",
    ...params,
  });
}

/**
 * Enhance Render-to-CAD Prompt
 */
export async function enhanceRenderToCadPrompt(params: {
  userPrompt: string;
  sourceImage: ImageData;
  settings: Record<string, any>;
  referenceImages?: ImageData[];
}): Promise<string> {
  return enhancePromptWithGPT({
    workflowType: "render-to-cad",
    ...params,
  });
}
