import type { Tool } from './tools';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResponse {
  text: string;
  toolCalls?: {
    name: string;
    arguments: Record<string, unknown>;
  }[];
}

export interface LLMProvider {
  generateResponse(
    messages: Message[],
    tools?: Tool[],
  ): Promise<CompletionResponse>;
  getApiKey(): string;
}

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model: string = 'google/gemini-2.5-flash',
    baseUrl: string = 'https://openrouter.ai/api/v1',
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async generateResponse(
    messages: Message[],
    tools?: Tool[],
  ): Promise<CompletionResponse> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://actualbudget.org', // Required by OpenRouter
      'X-Title': 'Actual Budget',
    };

    const body: any = {
      model: this.model,
      messages,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    const result: CompletionResponse = {
      text: message.content || '',
    };

    if (message.tool_calls) {
      result.toolCalls = message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));
    }

    return result;
  }
}
