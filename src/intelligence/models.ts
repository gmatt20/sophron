/**
 * Public model-management surface for the Electron layer: list the installed
 * chat models, read the active one, and switch it at runtime. Everything about
 * how models are resolved lives behind this.
 */
export { listChatModels, getModel, setModel } from './llm/ollamaClient.js';
