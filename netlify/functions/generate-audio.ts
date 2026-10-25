// netlify/functions/generate-audio.ts
declare const process: {
  env: {
    [key: string]: string | undefined;
    HF_ACCESS_TOKEN?: string;
  };
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { lyrics } = await req.json();
    const token = process.env.HF_ACCESS_TOKEN;

    if (!token) {
      return new Response("Missing HF_ACCESS_TOKEN environment variable in Netlify", {
        status: 500,
      });
    }

    // 1. Sanitize multiline lyrics into a clean spoken sentence for MMS-TTS
    const cleanText = (lyrics || "Electric signals pulse across the floor")
      .replace(/\n+/g, ". ")
      .replace(/[^a-zA-Z0-9\s.,!?'"]/g, "")
      .trim();

    // 2. Query Hugging Face Neural Text-to-Speech (facebook/mms-tts-eng)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-eng",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: cleanText,
          options: { wait: true },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return new Response(err, { status: response.status });
    }

    const audioBytes = await response.arrayBuffer();
    return new Response(new Uint8Array(audioBytes), {
      status: 200,
      headers: { "Content-Type": "audio/wav" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};