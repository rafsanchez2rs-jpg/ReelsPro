"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { instagramStepSchema } from "@/lib/validation/onboarding.schema";
import { FieldError, StepShell } from "@/components/onboarding/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type InstagramValues = {
  instagramUsername: string;
  preferredPostingHour: string;
  hasConnectedInstagram: boolean;
};

interface StepInstagramProps {
  defaultValues?: Partial<InstagramValues>;
  pending: boolean;
  onBack: () => void;
  onNext: (values: InstagramValues) => void;
}

export function StepInstagram({ defaultValues, pending, onBack, onNext }: StepInstagramProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InstagramValues>({
    resolver: zodResolver(instagramStepSchema),
    defaultValues: {
      instagramUsername: defaultValues?.instagramUsername ?? "",
      preferredPostingHour: defaultValues?.preferredPostingHour ?? "20:00",
      hasConnectedInstagram: defaultValues?.hasConnectedInstagram ?? false
    }
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <StepShell title="Conexao com Instagram" description="Defina sua conta e janela de postagem ideal.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="instagramUsername">Usuario Instagram</Label>
            <Input id="instagramUsername" {...register("instagramUsername")} placeholder="sualoja.oficial" />
            <FieldError message={errors.instagramUsername?.message} />
          </div>

          <div>
            <Label htmlFor="preferredPostingHour">Horario preferido</Label>
            <Input id="preferredPostingHour" type="time" {...register("preferredPostingHour")} />
            <FieldError message={errors.preferredPostingHour?.message} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("hasConnectedInstagram")} />
            Minha conta ja esta conectada via Meta Graph API
          </label>
          <FieldError message={errors.hasConnectedInstagram?.message} />

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
