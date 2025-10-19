// ============================================
// Manus API Client
// Version: 2.0 - REST API Direct
// Date: 2025-10-19
// ============================================

/**
 * Manus API Client
 *
 * Uses Manus REST API directly (NOT OpenAI SDK).
 * Manus uses responses.create() which is NOT available in OpenAI JS SDK.
 */
export class ManusClient {
  private apiKey: string;
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

    this.apiKey = process.env.MANUS_API_KEY;
    this.baseURL = process.env.MANUS_API_BASE_URL || "https://api.manus.ai/v1";
    this.webhookURL = process.env.MANUS_WEBHOOK_URL;
    this.agentProfile = process.env.MANUS_AGENT_PROFILE || "quality";
  }

  /**
   * Create a task for generating slide topics
   *
   * @param prompt - User prompt
   * @param userId - User ID
   * @returns Task ID from Manus API
   */
  async createTopicsTask(prompt: string, userId: string): Promise<string> {
    try {
      console.log("📤 Creating Manus topics task...");
      console.log("Prompt:", prompt.substring(0, 100) + "...");

      // Use Manus REST API directly
      const response = await fetch(`${this.baseURL}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API_KEY": this.apiKey, // ← Manus uses API_KEY header, not Bearer
        },
        body: JSON.stringify({
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `${this.getTopicsSystemPrompt()}\n\n---\n\nUser Request: ${prompt}`,
                },
              ],
            },
          ],
          extra_body: {
            task_mode: "agent", // ← NOT "mode"
            agent_profile: this.agentProfile,
            webhook_url: this.webhookURL,
            metadata: {
              user_id: userId,
              feature: "slides_topics",
              task_type: "generate_topics",
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Manus API error:", errorText);
        throw new Error(`Manus API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Manus returns { id, status, ... }
      const taskId = data.id; // ← NOT task_id!

      if (!taskId) {
        console.error("No task ID in response:", data);
        throw new Error("No task ID returned from Manus API");
      }

      console.log("✅ Manus topics task created:", taskId);
      console.log("Task URL:", data.metadata?.task_url);

      return taskId;
    } catch (error: any) {
      console.error("Error creating topics task:", error);
      throw new Error(`Failed to create topics task: ${error.message}`);
    }
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
      console.log("📤 Creating Manus slides task...");
      console.log("Presentation ID:", presentationId);
      console.log("Prompt:", prompt.substring(0, 100) + "...");

      // Use Manus REST API directly
      const response = await fetch(`${this.baseURL}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API_KEY": this.apiKey, // ← Manus uses API_KEY header, not Bearer
        },
        body: JSON.stringify({
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `${this.getSystemPrompt()}\n\n---\n\nUser Request: ${prompt}`,
                },
              ],
            },
          ],
          extra_body: {
            task_mode: "agent", // ← NOT "mode"
            agent_profile: this.agentProfile,
            webhook_url: this.webhookURL,
            metadata: {
              presentation_id: presentationId,
              feature: "slides",
              task_type: "generate_slides",
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Manus API error:", errorText);
        throw new Error(`Manus API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Manus returns { id, status, ... }
      const taskId = data.id; // ← NOT task_id!

      if (!taskId) {
        console.error("No task ID in response:", data);
        throw new Error("No task ID returned from Manus API");
      }

      console.log("✅ Manus slides task created:", taskId);
      console.log("Task URL:", data.metadata?.task_url);

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
      const response = await fetch(`${this.baseURL}/responses/${taskId}`, {
        method: "GET",
        headers: {
          "API_KEY": this.apiKey,
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
      const response = await fetch(`${this.baseURL}/responses/${taskId}/cancel`, {
        method: "POST",
        headers: {
          "API_KEY": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel task: ${response.statusText}`);
      }

      console.log("✅ Task cancelled:", taskId);
    } catch (error: any) {
      console.error("Error cancelling task:", error);
      throw new Error(`Failed to cancel task: ${error.message}`);
    }
  }

  /**
   * Get system prompt for topics generation
   */
  private getTopicsSystemPrompt(): string {
    return `You are a professional presentation expert. Your task is to analyze the user's topic and generate exactly 10 slide topics.

**Instructions:**
1. Analyze the topic thoroughly
2. Research if needed (use search/browse tools)
3. Generate exactly 10 slide topics
4. Topics should be:
   - Concise (max 60 characters each)
   - Logical and well-structured
   - Start with introduction
   - End with conclusion
   - Cover key aspects comprehensively

**Output Format:**
Return ONLY a JSON array of exactly 10 strings:

\`\`\`json
[
  "Introduction to Topic",
  "Background & History",
  "Key Concepts",
  "Main Features",
  "Use Cases",
  "Benefits",
  "Challenges",
  "Best Practices",
  "Future Trends",
  "Conclusion & Next Steps"
]
\`\`\`

**Tools Available:**
- search: Search the web for information
- browser: Browse websites for details
- python: Analyze data if needed

Use these tools to create comprehensive, well-researched topics.`;
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
