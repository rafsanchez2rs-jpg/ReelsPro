import { serverEnv } from "@/lib/env";

export interface VoiceSynthesisInput {
  text: string;
  voiceId: string;
  speed?: number;
}

export async function synthesizeWithElevenLabs(input: VoiceSynthesisInput): Promise<Buffer> {
  if (!serverEnv.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY nao configurada");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${input.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": serverEnv.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text: input.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.55,
        speed: input.speed ?? 1
      }
    })
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`ElevenLabs falhou: ${response.status} ${reason}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
