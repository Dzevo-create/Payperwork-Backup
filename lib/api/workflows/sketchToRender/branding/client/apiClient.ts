/**
 * API Client Module
 *
 * Handles OpenAI API calls with retry logic
 */

import { openaiClient, retryWithBackoff } from "@/lib/api/providers/openai";
import { apiLogger } from "@/lib/logger";
import { DEFAULT_MAX_TOKENS, DEFAULT_RETRY_ATTEMPTS, DEFAULT_BASE_DELAY } from "../constants";

/**
 * Calls OpenAI GPT-4o with retry logic
 */
export async function callBrandingEnhancement(
  messages: any[],
  brandName?: string
): Promise<string> {
  apiLogger.debug("Calling GPT-4o for branding enhancement", {
    messageCount: messages.length,
    hasImages: true,
    brand: brandName,
  });

  const response = await retryWithBackoff(
    () =>
      openaiClient.chat.completions.create({
        model: "gpt-4o",
        max_tokens: DEFAULT_MAX_TOKENS,
        messages,
      }),
    DEFAULT_RETRY_ATTEMPTS,
    DEFAULT_BASE_DELAY
  );

  // Debug: Log response
  apiLogger.debug("GPT-4o response received", {
    brand: brandName,
    hasChoices: !!response.choices,
    choicesLength: response.choices?.length,
    firstChoice: response.choices?.[0] ? {
      finishReason: response.choices[0].finish_reason,
      hasMessage: !!response.choices[0].message,
      messageRole: response.choices[0].message?.role,
      hasContent: !!response.choices[0].message?.content,
      contentLength: response.choices[0].message?.content?.length || 0,
      refusal: response.choices[0].message?.refusal,
    } : null,
  });

  const enhancedPrompt = response.choices[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    // Check if there was a refusal
    const refusal = response.choices[0]?.message?.refusal;
    if (refusal) {
      const error = new Error(`GPT-4o refused: ${refusal}`);
      apiLogger.error("GPT-4o refused the request", error, {
        brand: brandName,
      });
      throw error;
    }
    throw new Error("Empty response from GPT-4o");
  }

  return enhancedPrompt;
}
