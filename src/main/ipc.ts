import { BrowserWindow, dialog, ipcMain, app } from 'electron';
import { basename } from 'node:path';
import { IPC } from '@shared/ipc';
import type {
  ReflectionRequest,
  SpeechRequest,
  TranscriptionRequest,
  VaultInfo
} from '@shared/contracts';
import { getTranscriptionService } from './transcription';
import { getReflectionService } from './reflection';
import { getSpeechService } from './speech';
import { listChatModels, getModel, setModel } from '../intelligence/models';
import { vaultStore } from './vault';

export function registerIpc(): void {
  const transcription = getTranscriptionService();
  const reflection = getReflectionService();
  const speech = getSpeechService();

  ipcMain.handle(IPC.app.version, () => app.getVersion());

  ipcMain.handle(IPC.vault.get, (): VaultInfo | null => vaultStore.get());

  ipcMain.handle(IPC.vault.pick, async (event): Promise<VaultInfo | null> => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const opts = {
      title: 'Select your Obsidian vault',
      properties: ['openDirectory', 'createDirectory'] as Array<'openDirectory' | 'createDirectory'>,
      buttonLabel: 'Use this vault'
    };
    const result = parent
      ? await dialog.showOpenDialog(parent, opts)
      : await dialog.showOpenDialog(opts);
    if (result.canceled || result.filePaths.length === 0) return null;
    const path = result.filePaths[0]!;
    const info: VaultInfo = { path, name: basename(path) };
    vaultStore.set(info);
    return info;
  });

  ipcMain.handle(
    IPC.transcription.transcribe,
    async (_event, req: TranscriptionRequest) => transcription.transcribe(req)
  );

  ipcMain.handle(
    IPC.reflection.reflect,
    async (_event, req: ReflectionRequest) => reflection.reflect(req)
  );

  ipcMain.handle(IPC.speech.info, () => speech.info());
  ipcMain.handle(
    IPC.speech.synthesize,
    async (_event, req: SpeechRequest) => speech.synthesize(req)
  );

  ipcMain.handle(IPC.models.list, () => listChatModels());
  ipcMain.handle(IPC.models.get, () => getModel());
  ipcMain.handle(IPC.models.set, (_event, name: string) => {
    setModel(name);
    return getModel();
  });
}
