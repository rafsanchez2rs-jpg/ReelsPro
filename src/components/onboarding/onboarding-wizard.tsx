"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveOnboardingStepAction } from "@/actions/onboarding.actions";
import { StepAccount } from "@/components/onboarding/step-account";
import { StepInstagram } from "@/components/onboarding/step-instagram";
import { StepBrand } from "@/components/onboarding/step-brand";
import { StepVoice } from "@/components/onboarding/step-voice";
import { StepPlan } from "@/components/onboarding/step-plan";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { onboardingStepMeta } from "@/hooks/use-onboarding";
import {
  ONBOARDING_STEPS,
  type OnboardingActionState,
  type OnboardingFormData,
  type OnboardingState,
  type OnboardingStep
} from "@/types/domain";

interface OnboardingWizardProps {
  initialState: OnboardingState;
}

const FALLBACK_ACTION_STATE: OnboardingActionState = {
  success: false,
  message: "",
  currentStep: "account",
  completed: false,
  progress: 20,
  stepsData: {}
};

export function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>(initialState.currentStep);
  const [progress, setProgress] = useState(initialState.progress);
  const [completed, setCompleted] = useState(initialState.completed);
  const [message, setMessage] = useState<string>("");
  const [data, setData] = useState<OnboardingFormData>(initialState.stepsData);

  const activeIndex = useMemo(() => ONBOARDING_STEPS.indexOf(step), [step]);

  const submitStep = (stepToSave: OnboardingStep, payload: Record<string, string | number | boolean>, intent: "next" | "finish") => {
    const formData = new FormData();
    formData.set("step", stepToSave);
    formData.set("intent", intent);

    for (const [key, value] of Object.entries(payload)) {
      formData.set(key, String(value));
    }

    startTransition(async () => {
      const result = await saveOnboardingStepAction(FALLBACK_ACTION_STATE, formData);
      setMessage(result.message);
      setData(result.stepsData);
      setProgress(result.progress);
      setCompleted(result.completed);

      if (!result.completed) {
        setStep(result.currentStep);
      }
    });
  };

  const goBack = () => {
    if (activeIndex <= 0) return;
    setStep(ONBOARDING_STEPS[activeIndex - 1]);
    setProgress(activeIndex * 20);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 backdrop-blur">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Onboarding ReelShopee Pro</h1>
            <p className="text-sm text-slate-600">Configure em 5 passos e comece a publicar automaticamente.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{progress}%</span>
        </div>

        <Progress value={progress} />

        <div className="mt-4 grid grid-cols-5 gap-2">
          {ONBOARDING_STEPS.map((item, index) => {
            const meta = onboardingStepMeta[item];
            const isActive = item === step;
            const isDone = index < activeIndex || completed;

            return (
              <Tooltip key={item} content={meta.tooltip}>
                <div
                  className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
                    isActive
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <p className="font-semibold">{meta.title}</p>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            completed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {message}
        </div>
      ) : null}

      {completed ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-2xl font-semibold text-emerald-900">Tudo pronto para gerar seus primeiros reels</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Seu ambiente foi configurado. No proximo modulo conectaremos upload + analise de produto.
          </p>
        </section>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {step === "account" && (
              <StepAccount
                defaultValues={data.account}
                pending={isPending}
                onNext={(values) => submitStep("account", values, "next")}
              />
            )}

            {step === "instagram" && (
              <StepInstagram
                defaultValues={data.instagram}
                pending={isPending}
                onBack={goBack}
                onNext={(values) => submitStep("instagram", values, "next")}
              />
            )}

            {step === "branding" && (
              <StepBrand
                defaultValues={data.branding}
                pending={isPending}
                onBack={goBack}
                onNext={(values) => submitStep("branding", values, "next")}
              />
            )}

            {step === "voice" && (
              <StepVoice
                defaultValues={data.voice}
                pending={isPending}
                onBack={goBack}
                onNext={(values) => submitStep("voice", values, "next")}
              />
            )}

            {step === "plan" && (
              <StepPlan
                defaultValues={data.plan}
                pending={isPending}
                onBack={goBack}
                onFinish={(values) => submitStep("plan", values, "finish")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
