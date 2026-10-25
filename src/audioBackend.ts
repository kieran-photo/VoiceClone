// src/audioBackend.ts
export interface Clip {
  id: string;
  title: string;
  audioUrl: string;
  duration: number | null;
  coverImageUrl: string | null;
  lyrics?: { timingMarkers: number[][] | null } | null;
}

export interface SplitStemsResult {
  vocals: Clip;
  drums: Clip;
  bass: Clip;
  other: Clip;
}

// 1. Pure in-browser 16-bit PCM WAV Encoder
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

// 2. Mixes vocal audio with an electronic beat
async function mixVocalsWithElectronicBeat(
  vocalBlob: Blob,
  isAcapella: boolean,
  bpm = 128
): Promise<string> {
  // If Acapella is selected, return pure vocals
  if (isAcapella) {
    return URL.createObjectURL(vocalBlob);
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const vocalBuffer = await audioCtx.decodeAudioData(await vocalBlob.arrayBuffer());

  const duration = Math.max(vocalBuffer.duration, 8);
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

  // Layer 1: Spoken / Sung Vocals
  const vocalSource = offlineCtx.createBufferSource();
  vocalSource.buffer = vocalBuffer;
  const vocalGain = offlineCtx.createGain();
  vocalGain.gain.setValueAtTime(1.15, 0);
  vocalSource.connect(vocalGain);
  vocalGain.connect(offlineCtx.destination);
  vocalSource.start(0);

  // Layer 2: Electronic Backing Beat
  const beatSec = 60 / bpm;
  const totalBeats = Math.floor(duration / beatSec);

  for (let b = 0; b < totalBeats; b++) {
    const t = b * beatSec;

    // Kick Drum
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

    // Sub-Bassline
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
  return URL.createObjectURL(audioBufferToWav(mixedBuffer));
}

// 3. Fallback Synthesizer if offline or Netlify function not running
async function synthesizeLocalFallback(bpm = 128): Promise<string> {
  const sampleRate = 44100;
  const duration = 6;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const beatSec = 60 / bpm;

  for (let b = 0; b < 12; b++) {
    const t = b * beatSec;
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  const buf = await offlineCtx.startRendering();
  return URL.createObjectURL(audioBufferToWav(buf));
}

// 4. Main generateSong Function
export async function generateSong(params: {
  soundPrompt: string;
  lyrics?: string;
  title?: string;
}): Promise<Clip> {
  const isAcapella = params.soundPrompt.toLowerCase().includes("acapella");
  const cleanLyrics = params.lyrics?.trim() || "Electric signals pulse across the midnight floor";

  try {
    const res = await fetch("/.netlify/functions/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soundPrompt: params.soundPrompt,
        lyrics: cleanLyrics,
        title: params.title || "Electronic Vocal Track",
      }),
    });

    if (res.ok) {
      const vocalBlob = await res.blob();
      const audioUrl = await mixVocalsWithElectronicBeat(vocalBlob, isAcapella, 128);

      return {
        id: `track-${Date.now()}`,
        title: params.title || "Electronic Vocal Track",
        audioUrl,
        duration: null,
        coverImageUrl: null,
      };
    }

    console.warn("Netlify function response not OK:", await res.text());
  } catch (err) {
    console.warn("Netlify function unreachable, using local audio fallback:", err);
  }

  const audioUrl = await synthesizeLocalFallback(128);
  return {
    id: `local-${Date.now()}`,
    title: params.title || "Electronic Vocal Track",
    audioUrl,
    duration: 6,
    coverImageUrl: null,
  };
}

// 5. Stems Separator
export async function splitStems(_params: { clipId: string }): Promise<SplitStemsResult> {
  const dummy = await synthesizeLocalFallback(128);
  return {
    vocals: { id: `vocal-${Date.now()}`, title: "Isolated Vocals (Acapella)", audioUrl: dummy, duration: 6, coverImageUrl: null },
    drums: { id: `drum-${Date.now()}`, title: "Drums Stem", audioUrl: dummy, duration: 6, coverImageUrl: null },
    bass: { id: `bass-${Date.now()}`, title: "Bass Stem", audioUrl: dummy, duration: 6, coverImageUrl: null },
    other: { id: `other-${Date.now()}`, title: "Instruments & Synths", audioUrl: dummy, duration: 6, coverImageUrl: null },
  };
}

// 6. Lyrics Writer
export async function writeLyrics(_params: { prompt: string }): Promise<{ title: string; lyrics: string; soundPrompt: string }> {
  return {
    title: "Cybernetic Pulse",
    lyrics: "Electric signals pulse across the midnight floor\nLost inside the frequency we call our home",
    soundPrompt: "Electronic vocal track, 128 bpm",
  };
}