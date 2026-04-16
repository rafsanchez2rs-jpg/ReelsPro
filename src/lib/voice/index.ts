import { synthesizeWithCartesia } from "@/lib/voice/cartesia";
import { synthesizeWithElevenLabs } from "@/lib/voice/elevenlabs";

export type VoiceProvider = "elevenlabs" | "cartesia";

export async function synthesizeNarration(input: {
  provider: VoiceProvider;
  voiceId: string;
  script: string;
  speed?: number;
}): Promise<Buffer> {
  if (input.provider === "cartesia") {
    try {
      return await synthesizeWithCartesia({
        text: input.script,
        voiceId: input.voiceId,
        speed: input.speed
      });
    } catch {
      return synthesizeWithElevenLabs({
        text: input.script,
        voiceId: input.voiceId,
        speed: input.speed
      });
    }
  }

  try {
    return await synthesizeWithElevenLabs({
      text: input.script,
      voiceId: input.voiceId,
      speed: input.speed
    });
  } catch {
    return synthesizeWithCartesia({
      text: input.script,
      voiceId: input.voiceId,
      speed: input.speed
    });
  }
}
