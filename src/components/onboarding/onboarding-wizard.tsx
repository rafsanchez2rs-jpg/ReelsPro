"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  { id: 0, title: "Bem-vindo", description: "Configure sua conta" },
  { id: 1, title: "Marca", description: "Personalize sua marca" },
  { id: 2, title: "Voz", description: "Escolha a voz da narração" },
  { id: 3, title: "Pronto!", description: "Comece a criar Reels" }
];

interface OnboardingWizardProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  completed: boolean;
  children: React.ReactNode;
}

export function OnboardingWizard({ currentStep, onStepChange, completed, children }: OnboardingWizardProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">ReelFlow</h1>
          <p className="text-[var(--color-muted-foreground)]">Crie Reels automaticamente</p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => !completed && onStepChange(step.id)}
                disabled={completed}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition",
                  step.id === currentStep
                    ? "bg-[var(--color-primary)] text-white"
                    : step.id < currentStep || completed
                      ? "bg-[var(--color-success)] text-white"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                )}
              >
                {step.id < currentStep || completed ? "✓" : step.id + 1}
              </button>
              {step.id < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8", step.id < currentStep || completed ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export { STEPS };