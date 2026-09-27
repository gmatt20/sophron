import { useCallback, useEffect, useRef, useState } from 'react';
import { downsampleTo, encodeWav } from '../lib/wav';

const TARGET_SAMPLE_RATE = 16_000; // whisper.cpp native rate

export interface RecorderState {
  isRecording: boolean;
  level: number; // 0..1, for the mic visual
  error: string | null;
}

export interface RecorderControls extends RecorderState {
  start: () => Promise<void>;
  /** Stops the mic and returns the captured audio as 16 kHz mono WAV bytes. */
  stop: () => Promise<Uint8Array>;
}

/**
 * Simple mic recorder using the WebAudio API. We capture Float32 PCM at the
 * device's sample rate, buffer it in memory, then on stop downsample to
 * 16 kHz mono and encode to WAV so `WhisperCppTranscription` can consume it.
 *
 * MediaRecorder is deliberately avoided — its webm/opus output would need a
 * server-side transcode step before whisper.cpp will accept it.
 */
export function useRecorder(): RecorderControls {
  const [isRecording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // ScriptProcessorNode is deprecated but reliably available in Electron
      // and needs zero build config. Fine for a hackathon slice.
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      chunksRef.current = [];

      processor.onaudioprocess = (evt) => {
        const input = evt.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
        // Cheap RMS for the mic-level visual.
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i]! * input[i]!;
        const rms = Math.sqrt(sum / input.length);
        setLevel(Math.min(1, rms * 6));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access failed');
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(async (): Promise<Uint8Array> => {
    const ctx = ctxRef.current;
    const chunks = chunksRef.current;
    setRecording(false);

    const sampleRate = ctx?.sampleRate ?? 44_100;
    cleanup();

    const totalLen = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    const downsampled = downsampleTo(merged, sampleRate, TARGET_SAMPLE_RATE);
    return encodeWav(downsampled, TARGET_SAMPLE_RATE);
  }, [cleanup]);

  return { isRecording, level, error, start, stop };
}
