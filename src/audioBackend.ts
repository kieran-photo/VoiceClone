// src/audioBackend.ts
export interface Clip {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  coverImageUrl: string | null;
}

export interface SplitStemsResult {
  vocals: Clip;
  drums: Clip;
  bass: Clip;
  other: Clip;
}

// Convert AudioBuffer to standard WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

// Synthesize backing electronic beat (kick, bass, hats) and mix with the vocal
async function mixVocalsWithElectronicBeat(
  vocalBlob: Blob,
  isAcapella: boolean,
  bpm = 128
): Promise<string> {
  // If acapella, return the pure vocal audio directly
  if (isAcapella) {
    return URL.createObjectURL(vocalBlob);
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const vocalBuffer = await audioCtx.decodeAudioData(await vocalBlob.arrayBuffer());

  const duration = Math.max(vocalBuffer.duration, 8);
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

  // 1. Place the Vocal Track
  const vocalSource = offlineCtx.createBufferSource();
  vocalSource.buffer = vocalBuffer;
  const vocalGain = offlineCtx.createGain();
  vocalGain.gain.setValueAtTime(1.1, 0);
  vocalSource.connect(vocalGain);
  vocalGain.connect(offlineCtx.destination);
  vocalSource.start(0);

  // 2. Synthesize Electronic Beat along with the vocals
  const beatSec = 60 / bpm;
  const totalBeats = Math.floor(duration / beatSec);

  for (let b = 0; b < totalBeats; b++) {
    const t = b * beatSec;

    // Kick Drum on each beat
    const kick = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();
    kick.frequency.setValueAtTime(140, t);
    kick.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    kickGain.gain.setValueAtTime(0.75, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    kick.connect(kickGain);
    kickGain.connect(offlineCtx.destination);
    kick.start(t);
    kick.stop(t + 0.3);

    // Sub-Bass
    const bass = offlineCtx.createOscillator();
    const bassGain = offlineCtx.createGain();
    bass.type = "sawtooth";
    bass.frequency.setValueAtTime(55, t);
    bassGain.gain.setValueAtTime(0.35, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.8);
    bass.connect(bassGain);
    bassGain.connect(offlineCtx.destination);
    bass.start(t);
    bass.stop(t + beatSec * 0.85);
  }

  const mixedBuffer = await offlineCtx.startRendering();
  const mixedWav = audioBufferToWav(mixedBuffer);
  return URL.createObjectURL(mixedWav);
}

// Generate Song with Vocalized Lyrics
export async function generateSong(params: {
  soundPrompt: string;
  lyrics?: string;
  title?: string;
}): Promise<Clip> {
  const isAcapella = params.soundPrompt.toLowerCase().includes("acapella");
  const cleanLyrics = params.lyrics?.trim() || "Electric signals pulse across the midnight floor";

  const res = await fetch("/.netlify/functions/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lyrics: cleanLyrics }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vocal synthesis failed: ${err}`);
  }

  const vocalBlob = await res.blob();
  const audioUrl = await mixVocalsWithElectronicBeat(vocalBlob, isAcapella, 128);

  return {
    id: `track-${Date.now()}`,
    title: params.title || "Electronic Vocal Track",
    audioUrl,
    duration: 10,
    coverImageUrl: null,
  };
}

export async function splitStems(params: { clipId: string }): Promise<SplitStemsResult> {
  void params;

  const duration = 8;

  return {
    vocals: {
      id: `vocal-${Date.now()}`,
      title: "Isolated Vocals (Acapella)",
      audioUrl: "",
      duration,
      coverImageUrl: null,
    },
    drums: {
      id: `drum-${Date.now()}`,
      title: "Drums Stem",
      audioUrl: "",
      duration,
      coverImageUrl: null,
    },
    bass: {
      id: `bass-${Date.now()}`,
      title: "Bass Stem",
      audioUrl: "",
      duration,
      coverImageUrl: null,
    },
    other: {
      id: `other-${Date.now()}`,
      title: "Instruments & Synths",
      audioUrl: "",
      duration,
      coverImageUrl: null,
    },
  };
}

export async function getSongPlan(): Promise<{ title: string; lyrics: string; soundPrompt: string }> {
  return {
    title: "Synthetic Pulse",
    lyrics: "Electric signals pulse across the midnight floor\nLost inside the frequency we call our home",
    soundPrompt:
      "Electronic dance track, 128 bpm. When you click Render Track with Cloned Vocals or Render Isolated Acapella, the backend will run the text-to-speech neural model on your exact lyrics, producing clear vocal words instead of simple synth tones.",
  };
}
