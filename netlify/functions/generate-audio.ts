import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env?.HF_ACCESS_TOKEN;
  if (!token) {
    return { statusCode: 500, body: "HF_ACCESS_TOKEN environment variable is not configured on Netlify" };
  }

  const { action, prompt } = JSON.parse(event.body || "{}");

  try {
    // 1. Text-to-Music / Vocals via facebook/musicgen-small
    if (action === "generateSong") {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/musicgen-small",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        return { statusCode: response.status, body: await response.text() };
      }

      const audioBytes = await response.arrayBuffer();
      const bytes = new Uint8Array(audioBytes);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "audio/wav" },
        body: btoa(binary),
        isBase64Encoded: true,
      };
    }

    // 2. Lyrics Generation via Mistral-7B
    if (action === "writeLyrics") {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Write a short 4-line electronic vocaloid lyric about ${prompt}. Format: Title, followed by the 4 lines.`,
          }),
        }
      );

      const raw = await response.json();
      const generatedText = Array.isArray(raw) ? raw[0]?.generated_text : "";
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Synthetic Dreams",
          lyrics: generatedText || "Electric lasers tearing through the dark\nBassline rolling on the kick drum mark",
          soundPrompt: `${prompt}, 128 bpm, electronic`,
        }),
      };
    }

    return { statusCode: 400, body: "Invalid action" };
  } catch (error: any) {
    return { statusCode: 500, body: error.message };
  }
};