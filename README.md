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
- **Fish Speech** for local text-to-speech (falling back to macOS voices)

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

### Spoken replies (Fish Speech)

Sophron reads each question aloud in one of three voices (Warm, Steady,
Bright), picked in the sidebar next to the model. Replay any question from
the speaker icon beside it; the mic always silences playback first.

Out of the box this uses the built-in macOS voices (Samantha, Daniel,
Karen). For natural voices, run a local
[Fish Speech](https://github.com/fishaudio/fish-speech) API server:

```bash
# in your fish-speech checkout, after downloading the model weights
python tools/api_server.py --listen 127.0.0.1:8080 --device mps
```

Sophron detects it automatically (re-checked when the window regains focus)
and falls back to macOS voices if it stops. Each voice is a Fish *reference*:
a folder under the server's `references/` holding a 10–30 s clip and a `.lab`
file with its transcript:

```
references/
  sophron-warm/    sample.wav  sample.lab
  sophron-steady/  sample.wav  sample.lab
  sophron-bright/  sample.wav  sample.lab
```

A voice without a registered reference still speaks, in the model's default
voice. Only use clips you have the rights to, and check the Fish Speech model
licence before shipping anything commercial.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SOPHRON_FISH_URL` | `http://127.0.0.1:8080` | Fish API server |
| `SOPHRON_FISH_API_KEY` | — | if the server runs with `--api-key` |
| `SOPHRON_FISH_VOICE_1..3` | `sophron-warm` / `-steady` / `-bright` | reference ids for the three voices |
| `SOPHRON_TTS` | — | `system` skips Fish; `off` disables speech |

## Project layout

```
src/
  main/         Electron main process (window, IPC, vault, services)
    transcription/  TranscriptionService interface + whisper.cpp + mock
    reflection/     ReflectionService interface + mock
    speech/         SpeechService interface + Fish Speech + macOS `say`
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
