import { useEffect } from 'react';
import { refreshSpeechInfo, stopSpeaking } from '../lib/speech';
import { useVoice } from '../state/voice';
import { SpeakerIcon, SpeakerOffIcon } from './Icons';

const BACKEND_NOTE = {
  fish: 'Fish Speech (local)',
  system: 'macOS voices. Start Fish Speech for natural voices',
  none: ''
} as const;

/**
 * Sidebar control for spoken replies: an on/off toggle plus the choice of
 * three voices. Hidden when no speech backend is available.
 */
export function VoicePicker() {
  const { enabled, voiceId, info, setEnabled, setVoiceId } = useVoice();

  // Probe now and whenever the window regains focus, so starting or stopping
  // the Fish server shows up without restarting the app.
  useEffect(() => {
    refreshSpeechInfo();
    window.addEventListener('focus', refreshSpeechInfo);
    return () => window.removeEventListener('focus', refreshSpeechInfo);
  }, []);

  if (!info || info.backend === 'none' || info.voices.length === 0) return null;

  const current = info.voices.find((v) => v.id === voiceId) ?? info.voices[0]!;

  const toggle = () => {
    if (enabled) stopSpeaking();
    setEnabled(!enabled);
  };

  return (
    <div className="flex items-center gap-2 text-[12px] text-fg-muted">
      <span className="w-9 text-fg-faint shrink-0">voice</span>
      <select
        value={current.id}
        onChange={(e) => setVoiceId(e.target.value)}
        disabled={!enabled}
        title={`${current.description} · ${BACKEND_NOTE[info.backend]}`}
        className="min-w-0 flex-1 bg-transparent text-fg-muted hover:text-fg outline-none cursor-pointer truncate disabled:opacity-50 disabled:cursor-default"
      >
        {info.voices.map((v) => (
          <option key={v.id} value={v.id} className="bg-paper text-fg">
            {v.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Stop reading questions aloud' : 'Read questions aloud'}
        title={enabled ? 'Reading questions aloud' : 'Questions are silent'}
        className="p-1 rounded hover:text-fg hover:bg-paper transition-colors"
      >
        {enabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
      </button>
    </div>
  );
}
