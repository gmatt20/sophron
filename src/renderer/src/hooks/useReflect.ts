import { useCallback } from 'react';
import { api } from '../lib/api';
import { useSession } from '../state/session';
import { useRecorder } from './useRecorder';

/**
 * Orchestrates the full Speak → Remember → Reflect loop.
 *
 * Owns nothing about *how* we transcribe or reflect — that lives behind the
 * preload API. This hook just walks the state machine and reports phases.
 */
export function useReflect() {
  const recorder = useRecorder();
  const { vault, phase, setPhase, setTranscript, setResult, reset } = useSession();

  const beginListening = useCallback(async () => {
    reset();
    setPhase({ kind: 'listening' });
    await recorder.start();
  }, [recorder, reset, setPhase]);

  const finishAndReflect = useCallback(async () => {
    try {
      setPhase({ kind: 'transcribing' });
      const audio = await recorder.stop();

      const { transcript } = await api.transcription.transcribe({
        audio,
        mimeType: 'audio/wav'
      });
      setTranscript(transcript);

      setPhase({ kind: 'searching' });
      // Small deliberate beat so the UI's "Searching memory" state is
      // legible even when the backend is instant.
      await new Promise((r) => setTimeout(r, 400));

      setPhase({ kind: 'reflecting' });
      const result = await api.reflection.reflect({
        transcript,
        vaultPath: vault?.path
      });
      setResult(result);
      setPhase({ kind: 'ready' });
    } catch (e) {
      setPhase({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Something went wrong.'
      });
    }
  }, [recorder, setPhase, setResult, setTranscript, vault]);

  return {
    phase,
    level: recorder.level,
    recorderError: recorder.error,
    beginListening,
    finishAndReflect,
    reset
  };
}
