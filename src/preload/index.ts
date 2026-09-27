import { contextBridge } from 'electron';

// The typed bridge between the renderer and the main process.
// The reflection service will be wired through here later.
const api = {} as const;

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // Fallback when context isolation is disabled.
  (globalThis as Record<string, unknown>).api = api;
}

export type Api = typeof api;
