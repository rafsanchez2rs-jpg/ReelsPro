import { z } from "zod";
import { ONBOARDING_STEPS } from "@/types/domain";

export const onboardingStepSchema = z.enum(ONBOARDING_STEPS);

export const accountStepSchema = z.object({
  businessName: z.string().min(2, "Informe o nome do negocio"),
  niche: z.string().min(2, "Informe o nicho"),
  brandTone: z.string().min(2, "Informe o tom da marca")
});

export const instagramStepSchema = z.object({
  instagramUsername: z
    .string()
    .min(2, "Informe o usuario")
    .regex(/^[a-zA-Z0-9._]+$/, "Usuario do Instagram invalido"),
  preferredPostingHour: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM"),
  hasConnectedInstagram: z.boolean()
});

export const brandingStepSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Cor primaria invalida"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Cor secundaria invalida"),
  visualStyle: z.string().min(2, "Informe o estilo visual"),
  ctaStyle: z.string().min(2, "Informe o estilo de CTA")
});

export const voiceStepSchema = z.object({
  provider: z.enum(["elevenlabs", "cartesia"]),
  voiceId: z.string().min(2, "Informe a voz"),
  narrationStyle: z.string().min(2, "Informe o estilo de narracao"),
  narrationSpeed: z.coerce.number().min(0.7).max(1.4)
});

export const planStepSchema = z.object({
  desiredPlan: z.enum(["free", "pro", "enterprise"]),
  estimatedMonthlyReels: z.coerce.number().int().min(1).max(5000)
});

export const stepSchemas = {
  account: accountStepSchema,
  instagram: instagramStepSchema,
  branding: brandingStepSchema,
  voice: voiceStepSchema,
  plan: planStepSchema
};
