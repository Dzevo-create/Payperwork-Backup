/**
 * Universal GPT-4 Vision Prompt Enhancer
 *
 * This module provides a workflow-agnostic GPT-4o Vision integration that adapts
 * to different workflows (Sketch-to-Render, Furnish-Empty, Branding) based on
 * configuration.
 *
 * Benefits:
 * - Single source of truth for GPT-4 Vision prompting
 * - Prevents cross-workflow endpoint confusion
 * - Automatic adaptation to workflow goals
 * - Consistent error handling and fallback logic
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowType = "sketch-to-render" | "furnish-empty" | "branding" | "style-transfer";

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

CRITICAL REQUIREMENTS:
- The overall composition, layout, and perspective MUST remain faithful to the original sketch
- Transform sketch lines into realistic architectural elements and materials
- Add appropriate lighting, textures, materials, and atmospheric details
- Ensure architectural accuracy and realistic proportions
- Create a professional, photorealistic result suitable for architectural presentations

Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the sketch into a stunning photorealistic rendering.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Please analyze this architectural sketch or drawing and create a detailed prompt for transforming it into a photorealistic rendering based on the following:

RENDERING SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

Generate a flowing text prompt (no lists or bullet points) that:
1. Describes how to transform this sketch into a photorealistic rendering
2. Incorporates the style, lighting, and material preferences
3. Maintains the exact composition and perspective from the sketch
4. Adds realistic textures, materials, and atmospheric details
5. Ensures architectural accuracy and professional quality

The prompt should be detailed but concise (200-400 words), written as continuous flowing text that an AI image generator can use to create a stunning photorealistic rendering while preserving the original sketch's intent.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  "furnish-empty": {
    type: "furnish-empty",
    systemPrompt: `You are an expert interior designer and real estate staging consultant specializing in virtual furniture placement for empty rooms.

Your task is to analyze an empty room image and create a detailed, flowing text prompt for an AI image generator that will furnish the space appropriately for real estate marketing.

CRITICAL REQUIREMENTS:
- The room architecture (walls, windows, doors, flooring) MUST remain EXACTLY as shown
- Only add furniture, decor, and styling - never modify the room structure
- Ensure furniture placement is realistic and proportional to the room size
- Match lighting and shadows to the existing room conditions
- Create a professional, real estate listing-quality result

Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the empty space into a beautifully furnished room that appeals to potential buyers or renters.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Please analyze this empty room image and create a detailed furnishing prompt based on the following:

ROOM SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

Generate a flowing text prompt (no lists or bullet points) that:
1. Describes what furniture and decor to add to this specific room
2. Incorporates the style, color scheme, and density preferences
3. Maintains the exact room architecture visible in the image
4. Creates appropriate lighting atmosphere
5. Appeals to the target audience
6. Ensures realistic proportions and professional staging quality

The prompt should be detailed but concise (200-400 words), written as continuous flowing text that an AI image generator can use to furnish this empty room while preserving its original structure.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  branding: {
    type: "branding",
    systemPrompt: `You are an expert brand strategist and visual designer specializing in product branding, packaging design, and brand identity applications.

Your task is to analyze a product image and create a detailed, flowing text prompt for an AI image generator that will apply professional branding elements to the product.

CRITICAL REQUIREMENTS:
- The core product shape and form MUST remain recognizable
- Apply branding elements (logos, colors, typography, patterns) appropriately
- Ensure brand consistency and professional quality
- Maintain realistic lighting and material properties
- Create a market-ready, professional product visualization

Your prompt should be written as natural flowing text (not bullet points or lists), describing how to apply branding to the product in a way that looks professional and market-ready.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Please analyze this product image and create a detailed branding prompt based on the following:

BRANDING SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

Generate a flowing text prompt (no lists or bullet points) that:
1. Describes how to apply branding elements to this specific product
2. Incorporates the brand style, colors, and visual identity
3. Maintains the core product form and recognizability
4. Creates appropriate lighting and material finishes
5. Ensures professional, market-ready quality
6. Appeals to the target audience

The prompt should be detailed but concise (200-400 words), written as continuous flowing text that an AI image generator can use to create a professionally branded product visualization.`,
    maxTokens: 800,
    temperature: 0.7,
  },

  "style-transfer": {
    type: "style-transfer",
    systemPrompt: `You are an expert architectural stylist and design transformation specialist with deep knowledge of architectural styles, materiality, and design aesthetics across different periods and cultures.

Your task is to analyze two images - a source design and a reference style - and create a detailed, flowing text prompt for an AI image generator that will transfer the architectural style, materials, colors, and aesthetic qualities from the reference image to the source design.

CRITICAL REQUIREMENTS:
- Analyze the reference image thoroughly for style characteristics, materials, colors, proportions, and architectural details
- Apply the identified style elements to the source design while respecting structural preservation settings
- Maintain the overall composition and spatial arrangement of the source design
- Ensure realistic integration of style elements with proper scale and proportion
- Create a seamless blend between source design and reference style
- Preserve architectural coherence and structural integrity
- Maintain photorealistic quality with accurate lighting and shadows

Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the source design by adopting the style characteristics from the reference image.`,
    userPromptTemplate: ({ settingsContext, userPrompt }) => `Please analyze both the source design image and the reference style image, then create a detailed style transfer prompt based on the following:

STYLE TRANSFER SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ""}

Generate a flowing text prompt (no lists or bullet points) that:
1. Describes the style characteristics to transfer from the reference image
2. Explains how to apply these characteristics to the source design
3. Incorporates the transfer mode, strength, and preservation settings
4. Specifies material and color transfer approaches
5. Ensures architectural coherence and realistic integration
6. Maintains the specified detail level throughout

The prompt should be detailed but concise (200-400 words), written as continuous flowing text that an AI image generator can use to successfully transfer the architectural style from reference to source while maintaining structural integrity and photorealistic quality.`,
    maxTokens: 800,
    temperature: 0.7,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Builds a human-readable settings context string from settings object
 */
function buildSettingsContext(
  workflowType: WorkflowType,
  settings: Record<string, any>
): string {
  const lines: string[] = [];

  // Common pattern: iterate through settings and format them
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined && value !== null && value !== "") {
      // Convert camelCase to Title Case
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      lines.push(`- ${label}: ${value}`);
    }
  }

  return lines.join("\n");
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

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
