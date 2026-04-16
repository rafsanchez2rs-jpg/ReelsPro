import { serverEnv } from "@/lib/env";

export interface CartesiaVoiceInput {
  text: string;
  voiceId: string;
  speed?: number;
}

export async function synthesizeWithCartesia(input: CartesiaVoiceInput): Promise<Buffer> {
  if (!serverEnv.CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY nao configurada");
  }

  const response = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": serverEnv.CARTESIA_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model_id: "sonic-2",
      voice: {
        mode: "id",
        id: input.voiceId
      },
      language: "pt",
      transcript: input.text,
      output_format: {
        container: "mp3",
        sample_rate: 44100,
        bitrate: 128000
      },
      speed: input.speed ?? 1
    })
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Cartesia falhou: ${response.status} ${reason}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
