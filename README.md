# Sophron

A local-first desktop instrument for thinking. Speak what's on your mind,
Sophron retrieves a related thought from your Obsidian vault, and asks you
exactly one Socratic question.

> Speak · Remember · Reflect

## Stack

- **Electron** (main + preload + renderer, sandboxed)
- **TypeScript** across every process
- **React** for the renderer
- **Tailwind CSS** for all styling
- **whisper.cpp** for local speech-to-text (with a mock fallback so the app
  works before you install a model)

## Quick start

```bash
npm install
npm run dev
```

The app opens with a mock transcription and a mock reflection service, so
the full Speak → Remember → Reflect loop is drivable end-to-end with no
external dependencies.

### Enabling real whisper.cpp

Point the app at a locally built [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp)
binary and a ggml model, then start it:

```bash
export SOPHRON_WHISPER_BIN=/path/to/whisper.cpp/main
export SOPHRON_WHISPER_MODEL=/path/to/models/ggml-base.en.bin
npm run dev
```

The renderer already sends 16 kHz mono PCM WAV — the format whisper.cpp
expects — so no transcoding step is needed.

## Project layout

```
src/
  main/         Electron main process (window, IPC, vault, services)
    transcription/  TranscriptionService interface + whisper.cpp + mock
    reflection/     ReflectionService interface + mock
  preload/      contextBridge surface exposed to the renderer
  renderer/     React app (Tailwind only, no custom CSS bundles)
    components/ Small single-purpose UI pieces
    hooks/      useRecorder (mic → 16k WAV), useReflect (state machine)
    state/      Session store (zustand)
  shared/       Contracts and IPC channel names shared across processes
```

See [`docs/INTEGRATION.md`](docs/INTEGRATION.md) for how the Local
Intelligence engineer plugs their retrieval + Ollama pipeline in without
touching the desktop shell.
