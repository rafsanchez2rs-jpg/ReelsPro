"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { voiceStepSchema } from "@/lib/validation/onboarding.schema";
import { FieldError, StepShell } from "@/components/onboarding/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type VoiceValues = {
  provider: "elevenlabs" | "cartesia";
  voiceId: string;
  narrationStyle: string;
  narrationSpeed: number;
};

interface StepVoiceProps {
  defaultValues?: Partial<VoiceValues>;
  pending: boolean;
  onBack: () => void;
  onNext: (values: VoiceValues) => void;
}

export function StepVoice({ defaultValues, pending, onBack, onNext }: StepVoiceProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VoiceValues>({
    resolver: zodResolver(voiceStepSchema),
    defaultValues: {
      provider: defaultValues?.provider ?? "elevenlabs",
      voiceId: defaultValues?.voiceId ?? "pt-br-feminina-comercial-01",
      narrationStyle: defaultValues?.narrationStyle ?? "Energetica e confiavel",
      narrationSpeed: defaultValues?.narrationSpeed ?? 1
    }
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <StepShell title="Voz e Narracao" description="Defina a experiencia de audio padrao dos reels.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="provider">Provedor de voz</Label>
            <select
              id="provider"
              {...register("provider")}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none ring-[var(--brand)] focus:ring-2"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="cartesia">Cartesia</option>
            </select>
            <FieldError message={errors.provider?.message} />
          </div>

          <div>
            <Label htmlFor="voiceId">ID da voz</Label>
            <Input id="voiceId" {...register("voiceId")} />
            <FieldError message={errors.voiceId?.message} />
          </div>

          <div>
            <Label htmlFor="narrationStyle">Estilo de narracao</Label>
            <Textarea id="narrationStyle" {...register("narrationStyle")} />
            <FieldError message={errors.narrationStyle?.message} />
          </div>

          <div>
            <Label htmlFor="narrationSpeed">Velocidade da fala (0.7 a 1.4)</Label>
            <Input id="narrationSpeed" type="number" step="0.1" {...register("narrationSpeed", { valueAsNumber: true })} />
            <FieldError message={errors.narrationSpeed?.message} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
              Voltar
            </Button>
            <Button type="submit" disabled={pending}>
              Continuar
            </Button>
          </div>
        </div>
      </StepShell>
    </form>
  );
}
