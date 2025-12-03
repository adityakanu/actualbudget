# AI Assistant Implementation Documentation

## Overview
We have integrated a context-aware AI Assistant into Actual Budget. This assistant can answer questions about your finances, analyze spending trends, and generate visualizations (graphs) on demand. It uses OpenRouter to connect to LLMs like Google Gemini or Claude.

## Features Implemented

### 1. Context-Aware Chat Interface
- **UI**: A dedicated "AI Assistant" sidebar in the application.
- **Markdown Support**: Responses are rendered with rich formatting (tables, bold text, lists, code blocks).
- **History**: The assistant maintains conversation history for context (until refreshed/cleared).

### 2. Backend AI Service
- **Provider Agnostic**: Built on a flexible `LLMProvider` interface. Currently supports OpenRouter (Gemini, Claude, etc.).
- **System Prompt**: A robust system prompt injects the current date and instructions on how to use tools and generate graphs.

### 3. Intelligent Tools
The AI has access to specific tools to query your data:
- **`get_budget_month(month)`**: Retrieves detailed budget data (budgeted, spent, balance) for a specific month.
    - *Enhancement*: Automatically converts raw integer amounts (cents) to decimal currency (dollars) for accurate AI interpretation.
- **`run_aql_query(query)`**: Allows the AI to execute arbitrary AQL (Actual Query Language) queries to answer complex questions (e.g., "Show me top 5 payees").

### 4. Data Visualization (Canvas)
- **Graph Generation**: The AI can output structured JSON data to render charts.
- **Supported Types**: Bar charts, Pie charts, and Line charts.
- **Interactive**: Charts are rendered using `recharts` in a dedicated "Canvas" area next to the chat.

## Key Changes & Architecture

### Configuration
- **Environment Variables**: API keys and model selection are handled via `.env`.
    - `OPENROUTER_API_KEY`: Your OpenRouter key.
    - `OPENROUTER_MODEL`: (Optional) Model ID (e.g., `google/gemini-2.5-flash`, `anthropic/claude-3.5-sonnet`).
- **Vite Config**: Updated `packages/loot-core/vite.config.ts` to inject these variables into the browser build.

### Backend (`packages/loot-core/src/server/ai/`)
- **`app.ts`**: Registers the AI endpoints (`ai/chat`, `ai/status`) and initializes the service.
- **`ai-service.ts`**: Manages the conversation loop, system prompt injection, and tool execution.
- **`llm-provider.ts`**: Handles the HTTP communication with OpenRouter.
- **`tools.ts`**: Defines and implements the tools (`get_budget_month`, `run_aql_query`).

### Frontend (`packages/desktop-client/src/components/assistant/`)
- **`Assistant.tsx`**: The main chat component. Handles message state, markdown rendering, and JSON parsing for graphs.
- **`Canvas.tsx`**: Renders the visualizations based on data received from the Assistant.

## How to Extend

### Adding a New Tool
1.  Define the tool interface in `packages/loot-core/src/server/ai/tools.ts`.
2.  Implement the `execute` function.
3.  Register it in `packages/loot-core/src/server/ai/app.ts`:
    ```typescript
    toolRegistry.registerTool(myNewTool);
    ```
4.  Update the system prompt in `ai-service.ts` to inform the AI about the new tool.

### Changing the UI
- **Styling**: Modify `Assistant.tsx` (we use inline styles and a `<style>` block for markdown).
- **New Visualizations**: Update `Canvas.tsx` to support new chart types (e.g., Area chart, Scatter plot) using `recharts`.

### Switching Models
Simply update the `.env` file:
```bash
OPENROUTER_MODEL=vendor/model-name
```
Restart the server (`yarn start`) to apply changes.
