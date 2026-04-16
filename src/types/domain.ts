export type OnboardingStep = "account" | "instagram" | "branding" | "voice" | "plan";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "account",
  "instagram",
  "branding",
  "voice",
  "plan"
];

export type PlanTier = "free" | "pro" | "enterprise";

export interface OnboardingStepMap {
  account: {
    businessName: string;
    niche: string;
    brandTone: string;
  };
  instagram: {
    instagramUsername: string;
    preferredPostingHour: string;
    hasConnectedInstagram: boolean;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    visualStyle: string;
    ctaStyle: string;
  };
  voice: {
    provider: "elevenlabs" | "cartesia";
    voiceId: string;
    narrationStyle: string;
    narrationSpeed: number;
  };
  plan: {
    desiredPlan: PlanTier;
    estimatedMonthlyReels: number;
  };
}

export type OnboardingFormData = Partial<OnboardingStepMap>;

export interface OnboardingState {
  currentStep: OnboardingStep;
  completed: boolean;
  progress: number;
  stepsData: OnboardingFormData;
}

export interface OnboardingActionState {
  success: boolean;
  message: string;
  currentStep: OnboardingStep;
  completed: boolean;
  progress: number;
  stepsData: OnboardingFormData;
  fieldErrors?: Record<string, string[]>;
}
