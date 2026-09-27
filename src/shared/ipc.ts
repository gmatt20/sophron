/** Central registry of IPC channel names so main and renderer stay in sync. */
export const IPC = {
  vault: {
    pick: 'vault:pick',
    get: 'vault:get'
  },
  transcription: {
    transcribe: 'transcription:transcribe'
  },
  reflection: {
    reflect: 'reflection:reflect'
  },
  app: {
    version: 'app:version'
  }
} as const;
