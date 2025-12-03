# Actual Budget Codebase Overview

This document provides a high-level overview of the Actual Budget codebase, explaining the project structure, key packages, and their functionality.

## Project Structure

The project is a monorepo managed with Yarn Workspaces. The core code resides in the `packages` directory.

### Key Packages

| Package | Path | Description |
| :--- | :--- | :--- |
| **loot-core** | `packages/loot-core` | Contains the core business logic, backend logic (running in Electron/Browser), and shared utilities. This is the heart of the application. |
| **desktop-client** | `packages/desktop-client` | The React-based frontend application. It handles the UI, state management, and user interactions. |
| **sync-server** | `packages/sync-server` | The server responsible for synchronizing data between devices and handling authentication. |
| **desktop-electron** | `packages/desktop-electron` | The Electron wrapper that bundles the application for desktop platforms. |
| **api** | `packages/api` | Likely the public API or client library for interacting with Actual programmatically. |

## Detailed Package Analysis

### 1. loot-core (`packages/loot-core`)

This package contains the platform-agnostic logic.

*   **`src/server`**: This directory contains the "backend" logic that runs locally within the application (either in the Electron main process or a Web Worker in the browser).
    *   **`accounts`**: Account management logic.
    *   **`budget`**: Budgeting logic (envelopes, rollover, etc.).
    *   **`transactions`**: Transaction handling, importing, and processing.
    *   **`sync`**: Synchronization logic (client-side).
    *   **`db`**: Database interaction layer (SQLite).
    *   **`platform`**: Platform-specific adapters.
*   **`src/shared`**: Utilities and types shared between the client and server.
    *   **`arithmetic.ts`**: Financial math helpers.
    *   **`transactions.ts`**: Shared transaction types and helpers.
*   **`src/platform`**: Platform-specific implementations (Node.js vs. Browser) for things like file system access, networking, etc.

### 2. desktop-client (`packages/desktop-client`)

The frontend application built with React.

*   **`src/components`**: React components for the UI.
*   **`src/hooks`**: Custom React hooks.
*   **`src/modals`**: Modal dialog implementations.
*   **`src/style`**: Styling and themes.
*   **`src/util`**: Frontend-specific utilities.
*   **`src/index.tsx`**: Entry point for the React app.

### 3. sync-server (`packages/sync-server`)

The standalone synchronization server.

*   **`src/app.ts`**: Main Express application setup.
*   **`src/app-sync.ts`**: Synchronization endpoints and logic.
*   **`src/app-auth.ts`** (or similar): Authentication logic.
*   **`src/services`**: External services integrations.

### 4. desktop-electron (`packages/desktop-electron`)

The Electron wrapper for the desktop application.

*   **`index.ts`**: The main entry point. It:
    *   Creates the browser window (`createWindow`).
    *   Spawns a background process (`createBackgroundProcess`) that runs the `loot-core` server logic via `server.ts`.
    *   Can optionally start the `sync-server` locally (`startSyncServer`).
    *   Handles IPC messages for file dialogs, server management, and OAuth.
*   **`server.ts`**: The script that runs in the background utility process. It imports the `loot-core` bundle and initializes the app.
*   **`preload.ts`**: Preload script for the Electron window, exposing safe APIs to the renderer.

### 5. api (`packages/api`)

A client library for interacting with Actual programmatically. It communicates with the running Actual instance (or a local instance it starts up).

*   **`index.ts`**: Entry point. It can initialize a bundled version of the app (`bundle.api.js`) to run locally.
*   **`methods.ts`**: Exports a wide range of functions to interact with the budget.

**Available APIs (from `methods.ts`):**

*   **Import/Export**: `runImport`, `downloadBudget`
*   **Budget Management**: `loadBudget`, `getBudgets`, `getBudgetMonths`, `getBudgetMonth`, `setBudgetAmount`, `setBudgetCarryover`, `holdBudgetForNextMonth`, `resetBudgetHold`
*   **Transactions**: `addTransactions`, `importTransactions`, `getTransactions`, `updateTransaction`, `deleteTransaction`
*   **Accounts**: `getAccounts`, `createAccount`, `updateAccount`, `closeAccount`, `reopenAccount`, `deleteAccount`, `getAccountBalance`
*   **Categories**: `getCategoryGroups`, `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`, `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
*   **Payees**: `getPayees`, `getCommonPayees`, `createPayee`, `updatePayee`, `deletePayee`, `mergePayees`
*   **Rules**: `getRules`, `getPayeeRules`, `createRule`, `updateRule`, `deleteRule`
*   **Schedules**: `getSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule`
*   **Sync**: `sync`, `runBankSync`
*   **Other**: `runQuery` (deprecated), `aqlQuery`, `getServerVersion`

## Key Functionality Locations

| Feature | Location |
| :--- | :--- |
| **Budget Calculation** | `packages/loot-core/src/server/budget` |
| **Transaction Import** | `packages/loot-core/src/server/importers` |
| **Database Schema** | `packages/loot-core/src/server/db` |
| **UI Components** | `packages/desktop-client/src/components` |
| **Sync Logic (Client)** | `packages/loot-core/src/server/sync` |
| **Sync Logic (Server)** | `packages/sync-server/src/app-sync.ts` |
| **Electron Main Process** | `packages/desktop-electron/index.ts` |
| **Public API Methods** | `packages/api/methods.ts` |

## Notes

*   The `loot-core` package seems to export client paths (`./client/*`) in its `package.json`, but the `src/client` directory was not found during exploration. This might be an artifact of a previous structure or generated code.
*   The application uses a "local-first" architecture. In the Electron app, the "server" runs in a background utility process (`desktop-electron/server.ts` -> `loot-core/lib-dist/electron/bundle.desktop.js`).
*   The `api` package allows for headless interaction with the budget, useful for scripts and external integrations.
