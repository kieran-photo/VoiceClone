// netlify/functions/generate-audio.ts
export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { lyrics } = await req.json();
  const token = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env?.HF_ACCESS_TOKEN;

  if (!token) {
    return new Response("Missing HF_ACCESS_TOKEN", { status: 500 });
  }

  try {
    // 1. Neural Vocal Synthesis: converts lyrics into audible spoken/sung words
    // facebook/mms-tts-eng converts raw lyrics into clean vocal audio
    const textToVocalize = lyrics || "Electric signals pulse across the midnight floor";

    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-eng",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: textToVocalize,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(errText, { status: response.status });
    }

    const vocalAudioBytes = await response.arrayBuffer();
    return new Response(vocalAudioBytes, {
      status: 200,
      headers: { "Content-Type": "audio/flac" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};