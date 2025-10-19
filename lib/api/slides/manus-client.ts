// ============================================
// Manus API Client
// Version: 1.0
// Date: 2025-10-19
// ============================================

import OpenAI from "openai";

/**
 * Manus API Client
 *
 * Uses OpenAI SDK to communicate with Manus API.
 * Manus API is compatible with OpenAI's API format.
 */
export class ManusClient {
  private client: OpenAI;
  private baseURL: string;
  private webhookURL: string;
  private agentProfile: string;

  constructor() {
    // Validate environment variables
    if (!process.env.MANUS_API_KEY) {
      throw new Error("MANUS_API_KEY is not set in environment variables");
    }

    if (!process.env.MANUS_WEBHOOK_URL) {
      throw new Error("MANUS_WEBHOOK_URL is not set in environment variables");
    }

    this.baseURL = process.env.MANUS_API_BASE_URL || "https://api.manus.ai/v1";
    this.webhookURL = process.env.MANUS_WEBHOOK_URL;
    this.agentProfile = process.env.MANUS_AGENT_PROFILE || "quality";

    // Initialize OpenAI client with Manus API credentials
    this.client = new OpenAI({
      apiKey: process.env.MANUS_API_KEY,
      baseURL: this.baseURL,
    });
  }

  /**
   * Create a new task for generating slides
   *
   * @param prompt - User prompt for presentation
   * @param presentationId - ID of the presentation in database
   * @returns Task ID from Manus API
   */
  async createSlidesTask(prompt: string, presentationId: string): Promise<string> {
    try {
      // Create task using OpenAI SDK
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        // Manus-specific parameters
        // @ts-ignore - Manus extends OpenAI API
        mode: "agent",
        agent_profile: this.agentProfile,
        webhook_url: this.webhookURL,
        metadata: {
          presentation_id: presentationId,
          feature: "slides",
        },
      });

      // Extract task ID from response
      // @ts-ignore - Manus returns task_id
      const taskId = response.task_id;

      if (!taskId) {
        throw new Error("No task_id returned from Manus API");
      }

      return taskId;
    } catch (error: any) {
      console.error("Error creating Manus task:", error);
      throw new Error(`Failed to create Manus task: ${error.message}`);
    }
  }

  /**
   * Get task status from Manus API
   *
   * @param taskId - Manus task ID
   * @returns Task status and details
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.MANUS_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Manus API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error getting task status:", error);
      throw new Error(`Failed to get task status: ${error.message}`);
    }
  }

  /**
   * Cancel a running task
   *
   * @param taskId - Manus task ID
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/tasks/${taskId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MANUS_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel task: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error cancelling task:", error);
      throw new Error(`Failed to cancel task: ${error.message}`);
    }
  }

  /**
   * Get system prompt for slides generation
   *
   * @returns System prompt
   */
  private getSystemPrompt(): string {
    return `You are an expert presentation designer. Your task is to create professional, engaging presentations based on user input.

**Output Format:**
Return a JSON object with the following structure:

\`\`\`json
{
  "slides": [
    {
      "title": "Slide Title",
      "content": "Slide content in Markdown format",
      "layout": "title_slide" | "content" | "two_column" | "image" | "quote",
      "speaker_notes": "Notes for the presenter (optional)"
    }
  ]
}
\`\`\`

**Guidelines:**
1. Create 5-10 slides (depending on topic complexity)
2. Start with a title slide
3. Use appropriate layouts for each slide:
   - title_slide: For the first slide (title + subtitle)
   - content: For bullet points and text content
   - two_column: For comparisons or side-by-side content
   - image: For slides that need visual emphasis
   - quote: For important quotes or key messages
4. Use Markdown for formatting:
   - # for main headings
   - ## for subheadings
   - - for bullet points
   - **bold** for emphasis
   - *italic* for subtle emphasis
5. Keep content concise and impactful
6. Add speaker notes for complex slides
7. Structure: Intro → Main Content → Conclusion
8. Make it visually balanced and professional

**Example:**
\`\`\`json
{
  "slides": [
    {
      "title": "Remote Work: The Future of Work",
      "content": "# Remote Work\\n\\n## The Future of Work\\n\\nPresented by [Your Name]",
      "layout": "title_slide",
      "speaker_notes": "Welcome everyone. Today we'll explore the benefits and challenges of remote work."
    },
    {
      "title": "Why Remote Work?",
      "content": "## Benefits\\n\\n- **Flexibility** - Work from anywhere\\n- **Work-Life Balance** - Better time management\\n- **Cost Savings** - No commute, lower expenses\\n- **Productivity** - Fewer distractions",
      "layout": "content",
      "speaker_notes": "Highlight each benefit with real examples from your experience."
    }
  ]
}
\`\`\`

Now, create a presentation based on the user's prompt.`;
  }
}

// Singleton instance
let manusClient: ManusClient | null = null;

/**
 * Get Manus client instance (singleton)
 */
export function getManusClient(): ManusClient {
  if (!manusClient) {
    manusClient = new ManusClient();
  }
  return manusClient;
}
