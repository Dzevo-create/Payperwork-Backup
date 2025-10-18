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

  // TEMP DEBUG: Log user message content (text only, not images)
  const userMessage = messages.find(m => m.role === "user");
  const textContent = userMessage?.content?.find((c: any) => c.type === "text");
  apiLogger.debug("T-Button user message text", {
    brand: brandName,
    userMessageText: textContent?.text,
  });

  const response = await retryWithBackoff(
    () =>
      openaiClient.chat.completions.create({
        model: "gpt-4o",
        max_tokens: DEFAULT_MAX_TOKENS,
        messages,
      }),
    DEFAULT_RETRY_ATTEMPTS,
    DEFAULT_BASE_DELAY,
    "Branding Prompt Enhancement (GPT-4o)"
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

  // TEMP DEBUG: Log actual response content
  apiLogger.debug("GPT-4o actual response content", {
    brand: brandName,
    content: response.choices[0]?.message?.content,
  });

  const enhancedPrompt = response.choices[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    // Check if there was a refusal
    const refusal = response.choices[0]?.message?.refusal;
    if (refusal) {
      apiLogger.error("GPT-4o refused the request", {
        brand: brandName,
        refusal,
      });
      throw new Error(`GPT-4o refused: ${refusal}`);
    }
    throw new Error("Empty response from GPT-4o");
  }

  return enhancedPrompt;
}
