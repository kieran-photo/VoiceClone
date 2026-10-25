export interface Clip {
  id: string;
  title: string;
  audioUrl: string;
  duration: number | null;
  coverImageUrl: string | null;
  lyrics?: { text: string; timingMarkers: number[][] | null } | null;
}

export interface SplitStemsResult {
  vocals: Clip;
  drums: Clip;
  bass: Clip;
  other: Clip;
}

// Full song & acapella generation via Hugging Face MusicGen
export async function generateSong(params: {
  soundPrompt: string;
  lyrics?: string;
  title?: string;
}): Promise<Clip> {
  const prompt = `${params.soundPrompt}. Lyrics: ${params.lyrics || ""}`;

  const res = await fetch("/.netlify/functions/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generateSong", prompt }),
  });

  if (!res.ok) {
    throw new Error(`Hugging Face generation failed: ${await res.text()}`);
  }

  const blob = await res.blob();
  return {
    id: `hf-${Date.now()}`,
    title: params.title || "Hugging Face Electronic Track",
    audioUrl: URL.createObjectURL(blob),
    duration: null,
    coverImageUrl: null,
  };
}

// AI Lyrics generation via Hugging Face LLM
export async function writeLyrics(params: {
  prompt: string;
}): Promise<{ title: string; lyrics: string; soundPrompt: string }> {
  const res = await fetch("/.netlify/functions/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "writeLyrics", prompt: params.prompt }),
  });

  if (!res.ok) {
    return {
      title: "Neon Horizon",
      lyrics: "Electric signals pulse across the midnight floor\nLost inside the frequency we call our home",
      soundPrompt: "electronic dance track, 128 bpm",
    };
  }

  return await res.json();
}

// Stem separation via Hugging Face
export async function splitStems(params: { clipId: string }): Promise<SplitStemsResult> {
  const res = await fetch("/.netlify/functions/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "splitStems", clipId: params.clipId }),
  });

  if (!res.ok) {
    throw new Error(`Stem separation failed: ${await res.text()}`);
  }

  const { vocalsUrl, drumsUrl, bassUrl, otherUrl } = await res.json();
  return {
    vocals: { id: `vocal-${Date.now()}`, title: "Isolated Vocals (Acapella)", audioUrl: vocalsUrl, duration: 15, coverImageUrl: null },
    drums: { id: `drum-${Date.now()}`, title: "Drums Stem", audioUrl: drumsUrl, duration: 15, coverImageUrl: null },
    bass: { id: `bass-${Date.now()}`, title: "Bass Stem", audioUrl: bassUrl, duration: 15, coverImageUrl: null },
    other: { id: `other-${Date.now()}`, title: "Instruments Stem", audioUrl: otherUrl, duration: 15, coverImageUrl: null },
  };
}