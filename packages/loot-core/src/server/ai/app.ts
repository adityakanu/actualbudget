import { createApp } from '../app';
import { AssistantService } from './ai-service';
import { OpenRouterProvider } from './llm-provider';
import { ToolRegistry, getBudgetMonthTool, runAQLQueryTool } from './tools';

// Initialize tools
const toolRegistry = new ToolRegistry();
toolRegistry.registerTool(getBudgetMonthTool);
toolRegistry.registerTool(runAQLQueryTool);

// We'll initialize the service lazily or re-initialize with key
let service: AssistantService | null = null;

export const app = createApp();

app.method('ai/chat', async ({ message }: { message: string }) => {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
    
    if (!key) {
      return { error: 'API Key is required. Please configure OPENROUTER_API_KEY in .env' };
    }

    if (!service || service.getApiKey() !== key) {
      const provider = new OpenRouterProvider(key, model);
      service = new AssistantService(provider, toolRegistry);
    }
    
    return service.processMessage(message);
  } catch (error) {
    console.error('AI Chat Error:', error);
    return { error: error.message || 'An unknown error occurred' };
  }
});

app.method('ai/clear-history', async () => {
  if (service) {
    service.clearHistory();
  }
});

app.method('ai/status', async () => {
  console.log('AI Status Check: OPENROUTER_API_KEY is', process.env.OPENROUTER_API_KEY ? 'Present' : 'Missing');
  return {
    configured: !!process.env.OPENROUTER_API_KEY
  };
});
