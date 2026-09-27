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
  speech: {
    info: 'speech:info',
    synthesize: 'speech:synthesize'
  },
  models: {
    list: 'models:list',
    get: 'models:get',
    set: 'models:set'
  },
  app: {
    version: 'app:version'
  }
} as const;
