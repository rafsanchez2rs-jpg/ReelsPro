"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountStepSchema } from "@/lib/validation/onboarding.schema";
import { FieldError, StepShell } from "@/components/onboarding/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type AccountValues = {
  businessName: string;
  niche: string;
  brandTone: string;
};

interface StepAccountProps {
  defaultValues?: Partial<AccountValues>;
  pending: boolean;
  onNext: (values: AccountValues) => void;
}

export function StepAccount({ defaultValues, pending, onNext }: StepAccountProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AccountValues>({
    resolver: zodResolver(accountStepSchema),
    defaultValues: {
      businessName: defaultValues?.businessName ?? "",
      niche: defaultValues?.niche ?? "",
      brandTone: defaultValues?.brandTone ?? ""
    }
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <StepShell title="Conta e Posicionamento" description="Conte quem voce e para personalizarmos cada roteiro.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Nome da loja</Label>
            <Input id="businessName" {...register("businessName")} placeholder="Ex.: Casa Premium Shopee" />
            <FieldError message={errors.businessName?.message} />
          </div>

          <div>
            <Label htmlFor="niche">Nicho principal</Label>
            <Input id="niche" {...register("niche")} placeholder="Ex.: Casa e cozinha" />
            <FieldError message={errors.niche?.message} />
          </div>

          <div>
            <Label htmlFor="brandTone">Tom da comunicacao</Label>
            <Textarea
              id="brandTone"
              {...register("brandTone")}
              placeholder="Ex.: Direto, amigavel e orientado a conversao"
            />
            <FieldError message={errors.brandTone?.message} />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={pending}>
              Continuar
            </Button>
          </div>
        </div>
      </StepShell>
    </form>
  );
}
