import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { speak, stopSpeaking } from '../lib/speech';
import { useSession, type Turn } from '../state/session';
import { useRecorder } from './useRecorder';

/**
 * Orchestrates the Speak → Remember → Reflect loop, by voice or by typing.
 *
 * Owns nothing about *how* we transcribe or reflect — that lives behind the
 * preload API. This hook just walks the state machine, reports phases, and
 * files each finished exchange into the active journal entry.
 */
export function useReflect() {
  const recorder = useRecorder();
  const phase = useSession((s) => s.phase);
  const vault = useSession((s) => s.vault);
  const setPhase = useSession((s) => s.setPhase);
  const setPending = useSession((s) => s.setPending);
  const addTurn = useSession((s) => s.addTurn);

  // Bumped on cancel so an in-flight run knows to stop and not file a turn.
  const runId = useRef(0);

  const reflectOn = useCallback(
    async (said: string, via: Turn['via']) => {
      const myRun = runId.current;
      setPending(said);

      setPhase({ kind: 'searching' });
      // Small deliberate beat so the UI's "Searching memory" state is
      // legible even when the backend is instant.
      await new Promise((r) => setTimeout(r, 400));
      if (runId.current !== myRun) return;

      setPhase({ kind: 'reflecting' });
      const result = await api.reflection.reflect({
        transcript: said,
        vaultPath: vault?.path
      });
      const turnId = addTurn({ said, via, thought: result.thought, question: result.question });
      setPending(null);
      setPhase({ kind: 'idle' });
      void speak(result.question, turnId);
    },
    [addTurn, setPending, setPhase, vault]
  );

  const fail = useCallback(
    (e: unknown) => {
      setPending(null);
      setPhase({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Something went wrong.'
      });
    },
    [setPending, setPhase]
  );

  const beginListening = useCallback(async () => {
    // Never record Sophron's own voice.
    stopSpeaking();
    setPending(null);
    setPhase({ kind: 'listening' });
    const failure = await recorder.start();
    if (failure) setPhase({ kind: 'error', message: failure });
  }, [recorder, setPending, setPhase]);

  const finishAndReflect = useCallback(async () => {
    const myRun = runId.current;
    try {
      setPhase({ kind: 'transcribing' });
      const audio = await recorder.stop();
      if (runId.current !== myRun) return;
      const { transcript } = await api.transcription.transcribe({
        audio,
        mimeType: 'audio/wav'
      });
      if (runId.current !== myRun) return;
      await reflectOn(transcript, 'voice');
    } catch (e) {
      if (runId.current === myRun) fail(e);
    }
  }, [fail, recorder, reflectOn, setPhase]);

  const submitText = useCallback(
    async (text: string) => {
      const said = text.trim();
      if (!said) return;
      stopSpeaking();
      try {
        await reflectOn(said, 'text');
      } catch (e) {
        fail(e);
      }
    },
    [fail, reflectOn]
  );

  /** Abort whatever is in flight (recording, transcribing, reflecting). */
  const cancel = useCallback(async () => {
    runId.current += 1; // invalidate any in-flight run so it won't file a turn
    try {
      await recorder.stop();
    } catch {
      // nothing captured / already stopped — fine
    }
    setPending(null);
    setPhase({ kind: 'idle' });
  }, [recorder, setPending, setPhase]);

  const dismissError = useCallback(() => setPhase({ kind: 'idle' }), [setPhase]);

  return {
    phase,
    level: recorder.level,
    beginListening,
    finishAndReflect,
    submitText,
    cancel,
    dismissError
  };
}
