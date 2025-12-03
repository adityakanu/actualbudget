import { LLMProvider, Message } from './llm-provider';
import { ToolRegistry } from './tools';

export class AssistantService {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private history: Message[] = [];

  constructor(provider: LLMProvider, toolRegistry: ToolRegistry) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
  }

  async processMessage(content: string): Promise<string> {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM

    const systemPrompt = `You are a helpful financial assistant for Actual Budget.
Current Date: ${currentDate.toISOString().split('T')[0]}
Current Month: ${currentMonth}

You have access to the following tools:
1. get_budget_month(month: string): Returns budget details for a specific month (YYYY-MM). Use this for questions about income, expenses, or category balances for a specific month.
2. run_aql_query(query: object): Runs an AQL query. Use this for specific transaction searches or custom aggregations.

When asked about "this month", use ${currentMonth}.
If the user asks about spending on a specific category (e.g., "subscriptions"), try to find that category in the budget first.

You can also generate graphs! To do so, output a JSON block at the end of your response with the following structure:
\`\`\`json
{
  "type": "bar" | "pie" | "line",
  "title": "Chart Title",
  "data": [
    { "name": "Label 1", "value": 100 },
    { "name": "Label 2", "value": 200 }
  ],
  "dataKey": "value"
}
\`\`\`
Use "bar" for comparisons, "pie" for composition (like spending by category), and "line" for trends.
`;

    if (this.history.length === 0) {
      this.history.push({ role: 'system', content: systemPrompt });
    } else if (this.history[0].role === 'system') {
        // Update system prompt to keep time current
        this.history[0].content = systemPrompt;
    }

    this.history.push({ role: 'user', content });

    const tools = this.toolRegistry.getTools();
    const response = await this.provider.generateResponse(this.history, tools);

    if (response.toolCalls) {
      // Add the assistant's message with tool calls to history
      // Note: In a real implementation, we'd need to properly format this for the specific LLM provider
      // For now, we'll just append the text content if any, or a placeholder
      this.history.push({
        role: 'assistant',
        content: response.text || 'Calling tools...',
      });

      for (const toolCall of response.toolCalls) {
        try {
          console.log(`Executing tool: ${toolCall.name}`, toolCall.arguments);
          const result = await this.toolRegistry.executeTool(
            toolCall.name,
            toolCall.arguments,
          );
          
          // Add tool result to history
          this.history.push({
            role: 'user', // Most LLMs expect tool results as 'tool' role or 'user' role with specific format. 
                          // For simplicity in this MVP, we'll use 'user' role to feed back the result.
            content: `Tool '${toolCall.name}' result: ${JSON.stringify(result)}`,
          });
        } catch (error) {
           this.history.push({
            role: 'user',
            content: `Tool '${toolCall.name}' failed: ${error}`,
          });
        }
      }

      // Get final response after tool execution
      const finalResponse = await this.provider.generateResponse(this.history);
      this.history.push({ role: 'assistant', content: finalResponse.text });
      return finalResponse.text;
    }

    this.history.push({ role: 'assistant', content: response.text });
    return response.text;
  }

  clearHistory() {
    this.history = [];
  }

  getApiKey(): string {
    return this.provider.getApiKey();
  }
}
