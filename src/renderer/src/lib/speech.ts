import { api } from './api';
import { useVoice } from '../state/voice';

/**
 * Single app-wide player for spoken questions, so starting one clip (or the
 * mic) always silences the last. `generation` invalidates in-flight synthesis
 * that finishes after the user has moved on.
 */
let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let generation = 0;

function release() {
  audio?.pause();
  audio = null;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
}

export function stopSpeaking() {
  generation += 1;
  release();
  useVoice.getState().setSpeakingId(null);
}

/**
 * Speak `text` in the chosen voice. Auto-play respects the on/off setting;
 * `force` is for an explicit replay click. Failures are logged, never thrown:
 * speech is an enhancement and must not break the reflection loop.
 */
export async function speak(text: string, turnId: string, { force = false } = {}) {
  const { enabled, voiceId, info, setSpeakingId } = useVoice.getState();
  if ((!enabled && !force) || !info || info.backend === 'none') return;

  stopSpeaking();
  const mine = generation;
  setSpeakingId(turnId);

  try {
    const { audio: bytes, mimeType } = await api.speech.synthesize({ text, voiceId });
    if (mine !== generation) return;

    objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }));
    audio = new Audio(objectUrl);
    audio.onended = () => {
      if (mine === generation) stopSpeaking();
    };
    await audio.play();
  } catch (e) {
    console.warn('[speech] could not speak:', e);
    if (mine === generation) stopSpeaking();
  }
}

/** Re-probe the backend, e.g. after Fish Speech was started. */
export async function refreshSpeechInfo() {
  try {
    useVoice.getState().setInfo(await api.speech.info());
  } catch {
    useVoice.getState().setInfo({ backend: 'none', voices: [] });
  }
}
