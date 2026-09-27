/**
 * Encode a mono Float32 PCM buffer to a 16-bit PCM WAV byte array.
 * whisper.cpp expects exactly this format.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);              // PCM
  view.setUint16(22, 1, true);              // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);             // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

/** Downsample Float32 mono PCM from `inRate` to `outRate` with linear interp. */
export function downsampleTo(samples: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate === inRate) return samples;
  if (outRate > inRate) throw new Error('upsampling not supported');
  const ratio = inRate / outRate;
  const length = Math.floor(samples.length / ratio);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(i0 + 1, samples.length - 1);
    const frac = src - i0;
    out[i] = samples[i0]! * (1 - frac) + samples[i1]! * frac;
  }
  return out;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
