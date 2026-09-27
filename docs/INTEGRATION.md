# Integration guide

This document is the contract between the desktop shell and the other
engineers on the project. It describes exactly which surfaces are yours to
implement and which are owned by the desktop + voice layer.

## Ownership map

| Concern | Owner | File(s) |
| --- | --- | --- |
| Electron shell, windowing, IPC | Desktop + Voice | `src/main/index.ts`, `src/main/window.ts`, `src/main/ipc.ts` |
| Preload API (single surface to renderer) | Desktop + Voice | `src/preload/index.ts` |
| React UI, states, transitions | Desktop + Voice | `src/renderer/**` |
| Microphone capture + WAV encoding | Desktop + Voice | `src/renderer/src/hooks/useRecorder.ts`, `src/renderer/src/lib/wav.ts` |
| Vault picker | Desktop + Voice | `src/main/vault.ts` |
| Speech-to-text backend | Desktop + Voice | `src/main/transcription/**` |
| **Reflection (retrieval + reasoning)** | **Local Intelligence** | `src/main/reflection/**` |

## The one interface you implement

```ts
// src/main/reflection/ReflectionService.ts
export interface ReflectionService {
  readonly name: string;
  reflect(request: ReflectionRequest): Promise<ReflectionResult>;
}
```

Types (imported from `@shared/contracts`):

```ts
interface ReflectionRequest {
  transcript: string;
  vaultPath?: string;   // absolute path the user selected; may be undefined
}

interface PastThought {
  content: string;
  source: string;       // e.g. "Journal / 2025-08-14.md"
  date?: string;        // ISO date if you have one
}

interface ReflectionResult {
  thought: PastThought;
  question: string;     // exactly ONE Socratic question
}
```

## Wiring your implementation in

1. Add your class next to the mock, e.g. `src/main/reflection/OllamaReflectionService.ts`.
2. Edit only `src/main/reflection/index.ts` — swap `new MockReflectionService()`
   for `new OllamaReflectionService(...)`.
3. Nothing else changes. The renderer, preload, IPC channels, and the mock
   all stay put.

Do **not**:

- Import from `src/renderer/**` or `src/preload/**`
- Add new IPC channels (extend `src/shared/ipc.ts` first, coordinate the
  preload change with the desktop owner)
- Read audio directly — you receive text only, never a waveform

## Contract guarantees from the desktop shell

- `transcript` is a UTF-8 string, trimmed, may be empty on very short input
- `vaultPath` is either absolute or undefined; the folder exists at call time
- Your `reflect()` call runs in the Electron main process — full Node access
- Timeouts and error UX are handled by the renderer; throw a normal `Error`
  with a human message and the UI will surface it

## Shape of the STT boundary (for reference)

You do not need to touch this — the desktop shell owns it — but here is the
mirror interface so you know what's available:

```ts
export interface TranscriptionService {
  readonly name: string;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}
```

Backed today by `WhisperCppTranscription` (env-configured) with a
`MockTranscription` fallback.
