"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VoiceData {
  mode: "text" | "elevenlabs" | "cartesia";
  voiceId?: string;
}

interface StepVoiceProps {
  onNext: (data: VoiceData) => void;
  onBack: () => void;
  initialData?: VoiceData;
}

const VOICE_OPTIONS = [
  { id: "text", label: "Sem voz (só texto)", description: "Reels com legendas animadas", free: true },
  { id: "elevenlabs", label: "ElevenLabs (Premium)", description: "Voz realista em português", free: false },
  { id: "cartesia", label: "Cartesia (Premium)", description: "Voz natural e expressiva", free: false }
];

export function StepVoice({ onNext, onBack, initialData }: StepVoiceProps) {
  const [mode, setMode] = useState<VoiceData["mode"]>(initialData?.mode || "text");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha a Voz</CardTitle>
        <CardDescription>Como deseja a narração dos seus Reels?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {VOICE_OPTIONS.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setMode(voice.id as VoiceData["mode"])}
              disabled={!voice.free}
              className={`w-full rounded-lg border p-4 text-left transition ${
                mode === voice.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
              } ${!voice.free ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{voice.label}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{voice.description}</p>
                </div>
                {voice.free ? (
                  <span className="rounded-full bg-[var(--color-success)] px-2 py-0.5 text-xs text-white">Grátis</span>
                ) : (
                  <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">Premium</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Adicione chaves de API nas configurações para ativar vozes premium.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button onClick={() => onNext({ mode })} className="flex-1">
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}