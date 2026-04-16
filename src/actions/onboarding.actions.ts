"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { onboardingStepSchema, stepSchemas } from "@/lib/validation/onboarding.schema";
import {
  ONBOARDING_STEPS,
  type OnboardingActionState,
  type OnboardingFormData,
  type OnboardingStep
} from "@/types/domain";

const FALLBACK_STATE: OnboardingActionState = {
  success: false,
  message: "Falha ao salvar onboarding",
  currentStep: "account",
  completed: false,
  progress: 20,
  stepsData: {}
};

function getProgressByStep(step: OnboardingStep): number {
  return (ONBOARDING_STEPS.indexOf(step) + 1) * 20;
}

function getNextStep(step: OnboardingStep): OnboardingStep {
  const currentIndex = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(currentIndex + 1, ONBOARDING_STEPS.length - 1)];
}

function normalizeBoolean(value: string | null): boolean {
  return value === "true" || value === "on" || value === "1";
}

function readStepPayload(step: OnboardingStep, formData: FormData) {
  if (step === "account") {
    return {
      businessName: String(formData.get("businessName") ?? ""),
      niche: String(formData.get("niche") ?? ""),
      brandTone: String(formData.get("brandTone") ?? "")
    };
  }

  if (step === "instagram") {
    return {
      instagramUsername: String(formData.get("instagramUsername") ?? ""),
      preferredPostingHour: String(formData.get("preferredPostingHour") ?? ""),
      hasConnectedInstagram: normalizeBoolean(formData.get("hasConnectedInstagram")?.toString() ?? null)
    };
  }

  if (step === "branding") {
    return {
      primaryColor: String(formData.get("primaryColor") ?? ""),
      secondaryColor: String(formData.get("secondaryColor") ?? ""),
      visualStyle: String(formData.get("visualStyle") ?? ""),
      ctaStyle: String(formData.get("ctaStyle") ?? "")
    };
  }

  if (step === "voice") {
    return {
      provider: String(formData.get("provider") ?? "") as "elevenlabs" | "cartesia",
      voiceId: String(formData.get("voiceId") ?? ""),
      narrationStyle: String(formData.get("narrationStyle") ?? ""),
      narrationSpeed: String(formData.get("narrationSpeed") ?? "1")
    };
  }

  return {
    desiredPlan: String(formData.get("desiredPlan") ?? "") as "free" | "pro" | "enterprise",
    estimatedMonthlyReels: String(formData.get("estimatedMonthlyReels") ?? "1")
  };
}

function zodFieldErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors;
}

export async function saveOnboardingStepAction(
  prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const baseState = prevState ?? FALLBACK_STATE;

  try {
    const { userId, tenantId } = await getCurrentTenantContext();
    const supabase = await createServerSupabaseClient();

    const step = onboardingStepSchema.parse(formData.get("step"));
    const intent = String(formData.get("intent") ?? "next");

    const payload = readStepPayload(step, formData);
    const parsed = stepSchemas[step].parse(payload);

    const { data: existing } = await supabase
      .from("onboarding_progress")
      .select("steps_data, current_step")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const mergedData: OnboardingFormData = {
      ...(existing?.steps_data ?? {}),
      [step]: parsed
    };

    const isLastStep = step === "plan";
    const shouldComplete = intent === "finish" || (isLastStep && intent === "next");
    const nextStep = shouldComplete ? "plan" : getNextStep(step);

    const upsertPayload = {
      tenant_id: tenantId,
      current_step: shouldComplete ? "completed" : nextStep,
      steps_data: mergedData,
      completed: shouldComplete,
      completed_at: shouldComplete ? new Date().toISOString() : null
    };

    const { error: onboardingError } = await supabase.from("onboarding_progress").upsert(upsertPayload, {
      onConflict: "tenant_id"
    });

    if (onboardingError) {
      throw onboardingError;
    }

    if (shouldComplete) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }
    }

    revalidatePath("/onboarding");

    return {
      success: true,
      message: shouldComplete ? "Onboarding concluido com sucesso" : "Etapa salva com sucesso",
      currentStep: nextStep,
      completed: shouldComplete,
      progress: shouldComplete ? 100 : getProgressByStep(nextStep),
      stepsData: mergedData
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ...baseState,
        success: false,
        message: "Corrija os campos destacados para continuar",
        fieldErrors: zodFieldErrors(error)
      };
    }

    return {
      ...baseState,
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado no onboarding"
    };
  }
}
