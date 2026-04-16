import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { onboardingProgress } from "@/hooks/use-onboarding";
import { type OnboardingState, type OnboardingStep } from "@/types/domain";

function toStep(value: string | null | undefined): OnboardingStep {
  if (!value || value === "completed") return "plan";

  if (value === "account" || value === "instagram" || value === "branding" || value === "voice" || value === "plan") {
    return value;
  }

  return "account";
}

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { tenantId } = await getCurrentTenantContext();

  const { data: onboarding } = await supabase
    .from("onboarding_progress")
    .select("current_step, completed, steps_data")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const currentStep = toStep(onboarding?.current_step);

  const initialState: OnboardingState = {
    currentStep,
    completed: Boolean(onboarding?.completed),
    progress: onboarding?.completed ? 100 : onboardingProgress(currentStep),
    stepsData: (onboarding?.steps_data as OnboardingState["stepsData"]) ?? {}
  };

  return <OnboardingWizard initialState={initialState} />;
}
