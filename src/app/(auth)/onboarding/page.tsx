"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard, STEPS } from "@/components/onboarding/onboarding-wizard";
import { StepAccount } from "@/components/onboarding/step-account";
import { StepBrand } from "@/components/onboarding/step-brand";
import { StepVoice } from "@/components/onboarding/step-voice";
import { StepShell } from "@/components/onboarding/step-shell";
import { saveOnboardingProgress, completeOnboarding } from "@/actions/onboarding.actions";

interface StepData {
  fullName?: string;
  brand?: {
    brandName: string;
    brandColor: string;
    accentPhrase: string;
  };
  voice?: {
    mode: "text" | "elevenlabs" | "cartesia";
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);

  const handleStepChange = async (step: number) => {
    setLoading(true);
    try {
      await saveOnboardingProgress("demo-user", step, stepData);
      setCurrentStep(step);
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (data: StepData) => {
    setStepData((prev) => ({ ...prev, ...data }));
    handleStepChange(currentStep + 1);
  };

  const handleBack = () => {
    handleStepChange(currentStep - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeOnboarding(
        "demo-user",
        stepData.fullName || "Usuário",
        { brand: stepData.brand, voice: stepData.voice }
      );
      setCompleted(true);
      router.push("/");
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingWizard
      currentStep={currentStep}
      onStepChange={handleStepChange}
      completed={completed}
    >
      {currentStep === 0 && <StepAccount onNext={(data) => handleNext({ fullName: data.fullName })} />}
      {currentStep === 1 && (
        <StepBrand
          onNext={(data) => handleNext({ brand: data })}
          onBack={handleBack}
          initialData={stepData.brand}
        />
      )}
      {currentStep === 2 && (
        <StepVoice
          onNext={(data) => handleNext({ voice: data })}
          onBack={handleBack}
          initialData={stepData.voice}
        />
      )}
      {currentStep === 3 && <StepShell onComplete={handleComplete} />}
    </OnboardingWizard>
  );
}