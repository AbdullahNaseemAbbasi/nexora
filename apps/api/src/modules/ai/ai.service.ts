import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>("GROQ_API_KEY") || "";
    this.model = this.config.get<string>("GROQ_MODEL") || "llama-3.3-70b-versatile";
  }

  private async callGroq(systemPrompt: string, userMessage: string, maxTokens = 1024): Promise<string> {
    if (!this.apiKey || this.apiKey === "your-groq-api-key-here") {
      throw new BadRequestException(
        "GROQ_API_KEY not configured. Get a free key at console.groq.com",
      );
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new BadRequestException(`Groq API error: ${err}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || "";
  }

  async suggestTasks(goal: string, context?: string): Promise<{ tasks: string[] }> {
    const system = `You are a project management assistant. When given a goal, you generate a list of clear, actionable task titles.
Rules:
- Return ONLY a JSON array of task title strings, nothing else
- Each task should be specific and actionable (start with a verb)
- Generate 5-8 tasks
- Keep each title under 80 characters
- No numbering, no descriptions, just titles
Example output: ["Set up project repository", "Design database schema", "Build authentication API"]`;

    const userMsg = context ? `Goal: ${goal}\nAdditional context: ${context}` : `Goal: ${goal}`;
    const raw = await this.callGroq(system, userMsg, 512);

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return { tasks: [] };

    try {
      const tasks = JSON.parse(match[0]) as string[];
      return { tasks: Array.isArray(tasks) ? tasks.slice(0, 8) : [] };
    } catch {
      return { tasks: [] };
    }
  }

  async summarize(text: string): Promise<{ summary: string }> {
    const system = `You are a concise summarization assistant. Summarize the given text in 2-4 sentences. Be clear, factual, and preserve the key points. Do not add commentary.`;
    const summary = await this.callGroq(system, text, 300);
    return { summary: summary.trim() };
  }

  async chat(message: string, _tenantId: string, _userId: string, projectContext?: string): Promise<{ reply: string }> {
    const system = `You are a helpful project management assistant for a SaaS platform called Nexora.
You help teams manage projects, tasks, and workflows effectively.
${projectContext ? `Current project context: ${projectContext}` : ""}
Be concise, practical, and actionable in your responses.`;

    const reply = await this.callGroq(system, message, 600);
    return { reply: reply.trim() };
  }
}
