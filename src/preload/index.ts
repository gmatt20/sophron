import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  ReflectionRequest,
  ReflectionResult,
  SpeechInfo,
  SpeechRequest,
  SpeechResult,
  TranscriptionRequest,
  TranscriptionResult,
  VaultInfo
} from '@shared/contracts';

/**
 * The single surface the renderer sees. No Node APIs, no fs, no shell.
 * Anything the UI needs from the OS goes through here.
 */
const api = {
  app: {
    version: (): Promise<string> => ipcRenderer.invoke(IPC.app.version)
  },
  vault: {
    get: (): Promise<VaultInfo | null> => ipcRenderer.invoke(IPC.vault.get),
    pick: (): Promise<VaultInfo | null> => ipcRenderer.invoke(IPC.vault.pick)
  },
  transcription: {
    transcribe: (req: TranscriptionRequest): Promise<TranscriptionResult> =>
      ipcRenderer.invoke(IPC.transcription.transcribe, req)
  },
  reflection: {
    reflect: (req: ReflectionRequest): Promise<ReflectionResult> =>
      ipcRenderer.invoke(IPC.reflection.reflect, req)
  },
  speech: {
    info: (): Promise<SpeechInfo> => ipcRenderer.invoke(IPC.speech.info),
    synthesize: (req: SpeechRequest): Promise<SpeechResult> =>
      ipcRenderer.invoke(IPC.speech.synthesize, req)
  },
  models: {
    list: (): Promise<string[]> => ipcRenderer.invoke(IPC.models.list),
    get: (): Promise<string> => ipcRenderer.invoke(IPC.models.get),
    set: (name: string): Promise<string> => ipcRenderer.invoke(IPC.models.set, name)
  }
};

export type SophronApi = typeof api;

contextBridge.exposeInMainWorld('sophron', api);
