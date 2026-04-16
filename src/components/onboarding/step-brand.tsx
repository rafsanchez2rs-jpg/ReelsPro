"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandingStepSchema } from "@/lib/validation/onboarding.schema";
import { FieldError, StepShell } from "@/components/onboarding/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type BrandingValues = {
  primaryColor: string;
  secondaryColor: string;
  visualStyle: string;
  ctaStyle: string;
};

interface StepBrandProps {
  defaultValues?: Partial<BrandingValues>;
  pending: boolean;
  onBack: () => void;
  onNext: (values: BrandingValues) => void;
}

export function StepBrand({ defaultValues, pending, onBack, onNext }: StepBrandProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BrandingValues>({
    resolver: zodResolver(brandingStepSchema),
    defaultValues: {
      primaryColor: defaultValues?.primaryColor ?? "#0057FF",
      secondaryColor: defaultValues?.secondaryColor ?? "#FF7A00",
      visualStyle: defaultValues?.visualStyle ?? "Vitrine premium com textos objetivos",
      ctaStyle: defaultValues?.ctaStyle ?? "Compre agora com desconto"
    }
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <StepShell title="Identidade Visual" description="Ajuste estilo para capas e overlays dos reels.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="primaryColor">Cor primaria</Label>
            <Input id="primaryColor" {...register("primaryColor")} />
            <FieldError message={errors.primaryColor?.message} />
          </div>

          <div>
            <Label htmlFor="secondaryColor">Cor secundaria</Label>
            <Input id="secondaryColor" {...register("secondaryColor")} />
            <FieldError message={errors.secondaryColor?.message} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="visualStyle">Estilo visual</Label>
            <Textarea id="visualStyle" {...register("visualStyle")} />
            <FieldError message={errors.visualStyle?.message} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="ctaStyle">Assinatura de CTA</Label>
            <Input id="ctaStyle" {...register("ctaStyle")} />
            <FieldError message={errors.ctaStyle?.message} />
          </div>

          <div className="flex gap-2 pt-2 md:col-span-2">
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
