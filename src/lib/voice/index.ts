interface VoiceGenerationInput {
  script: string;
  voiceProvider?: "elevenlabs" | "cartesia";
  voiceId?: string;
}

interface GeneratedVoice {
  audioUrl: string;
  durationMs: number;
}

export async function generateVoice(input: VoiceGenerationInput): Promise<GeneratedVoice> {
  const { script, voiceProvider = "elevenlabs" } = input;

  if (voiceProvider === "elevenlabs") {
    return generateWithElevenLabs(script);
  }

  return generateWithCartesia(script);
}

async function generateWithElevenLabs(script: string): Promise<GeneratedVoice> {
  const { serverEnv } = await import("@/lib/env");

  if (!serverEnv.ELEVENLABS_API_KEY) {
    return getMockVoice();
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/r29yZ2K3BElWVR9F28G3/convert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": serverEnv.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs error:", await response.text());
      return getMockVoice();
    }

    const audioData = await response.arrayBuffer();
    const base64 = Buffer.from(audioData).toString("base64");

    return {
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      durationMs: script.length * 50
    };
  } catch (error) {
    console.error("Erro ElevenLabs:", error);
    return getMockVoice();
  }
}

async function generateWithCartesia(script: string): Promise<GeneratedVoice> {
  const { serverEnv } = await import("@/lib/env");

  if (!serverEnv.CARTESIA_API_KEY) {
    return getMockVoice();
  }

  try {
    const response = await fetch("https://api.cartesia.ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cartesia-API-Key": serverEnv.CARTESIA_API_KEY
      },
      body: JSON.stringify({
        transcript: script,
        voice_id: "a2be3f80-7c9e-4a57-8c5a-2e4d3b8a6f1c",
        language: "pt-BR",
        output_format: { container: "mp3", bitrate: 128, sample_rate: 44100 }
      })
    });

    if (!response.ok) {
      console.error("Cartesia error:", await response.text());
      return getMockVoice();
    }

    const audioData = await response.arrayBuffer();
    const base64 = Buffer.from(audioData).toString("base64");

    return {
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      durationMs: script.length * 50
    };
  } catch (error) {
    console.error("Erro Cartesia:", error);
    return getMockVoice();
  }
}

function getMockVoice(): GeneratedVoice {
  return {
    audioUrl: "",
    durationMs: 0
  };
}

export function isPremiumMode(): boolean {
  const { serverEnv } = require("@/lib/env");
  return !!(
    serverEnv.ELEVENLABS_API_KEY ||
    serverEnv.SHOTSTACK_API_KEY ||
    serverEnv.FLUX_API_KEY
  );
}