"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planStepSchema } from "@/lib/validation/onboarding.schema";
import { FieldError, StepShell } from "@/components/onboarding/step-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PlanValues = {
  desiredPlan: "free" | "pro" | "enterprise";
  estimatedMonthlyReels: number;
};

interface StepPlanProps {
  defaultValues?: Partial<PlanValues>;
  pending: boolean;
  onBack: () => void;
  onFinish: (values: PlanValues) => void;
}

export function StepPlan({ defaultValues, pending, onBack, onFinish }: StepPlanProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PlanValues>({
    resolver: zodResolver(planStepSchema),
    defaultValues: {
      desiredPlan: defaultValues?.desiredPlan ?? "pro",
      estimatedMonthlyReels: defaultValues?.estimatedMonthlyReels ?? 120
    }
  });

  return (
    <form onSubmit={handleSubmit(onFinish)}>
      <StepShell title="Plano Inicial" description="Escolha seu plano para liberar os recursos certos no lancamento.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="desiredPlan">Plano desejado</Label>
            <select
              id="desiredPlan"
              {...register("desiredPlan")}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none ring-[var(--brand)] focus:ring-2"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <FieldError message={errors.desiredPlan?.message} />
          </div>

          <div>
            <Label htmlFor="estimatedMonthlyReels">Reels por mes (estimativa)</Label>
            <Input
              id="estimatedMonthlyReels"
              type="number"
              {...register("estimatedMonthlyReels", { valueAsNumber: true })}
            />
            <FieldError message={errors.estimatedMonthlyReels?.message} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
              Voltar
            </Button>
            <Button type="submit" disabled={pending}>
              Finalizar onboarding
            </Button>
          </div>
        </div>
      </StepShell>
    </form>
  );
}
