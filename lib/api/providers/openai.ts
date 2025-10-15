/**
 * OpenAI provider utility with retry logic
 * Centralized configuration and helper functions for OpenAI API
 */

import OpenAI from "openai";
import { apiLogger } from "@/lib/logger";

// Initialize OpenAI client
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI model configurations
export const OPENAI_MODELS = {
  "gpt-4o": "gpt-4o",
  "gpt-5": "gpt-5",
  chat: "gpt-4o", // Default to GPT-4o for speed, GPT-5 available on demand
  enhancement: "gpt-4o", // Enhancement still uses 4o for speed
} as const;

// OpenAI API parameters for chat (dynamic model support)
export const getOpenAIChatConfig = (model: "gpt-4o" | "gpt-5" = "gpt-4o") => {
  // GPT-5 doesn't support frequency_penalty and presence_penalty
  if (model === "gpt-5") {
    return {
      model,
      temperature: 1,
      top_p: 1,
    };
  }

  // GPT-4o supports all parameters
  return {
    model,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0.5,
    presence_penalty: 0.2,
  };
};

// Legacy config for backward compatibility
export const OPENAI_CHAT_CONFIG = getOpenAIChatConfig(OPENAI_MODELS.chat);

export const OPENAI_ENHANCEMENT_CONFIG = {
  model: OPENAI_MODELS.enhancement,
  temperature: 0.7,
  max_tokens: 600,
} as const;

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Last retry, throw error
      if (i === maxRetries - 1) {
        throw error;
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      apiLogger.debug(`Retrying OpenAI request (attempt ${i + 1}/${maxRetries})`, { delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

// Enhanced prompt generation
export async function enhancePrompt(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const response = await retryWithBackoff(() =>
    openaiClient.chat.completions.create({
      ...OPENAI_ENHANCEMENT_CONFIG,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    })
  );

  const enhancedPrompt = response.choices[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    throw new Error("No enhanced prompt generated");
  }

  return enhancedPrompt;
}

// Create streaming chat completion with model selection
export async function createChatStream(messages: any[], model: "gpt-4o" | "gpt-5" = "gpt-4o") {
  return await retryWithBackoff(
    () =>
      openaiClient.chat.completions.create({
        ...getOpenAIChatConfig(model),
        messages,
        stream: true,
      }),
    3,
    1000
  );
}
