import { ONBOARDING_STEPS, type OnboardingStep } from "@/types/domain";

export const onboardingStepMeta: Record<OnboardingStep, { title: string; description: string; tooltip: string }> = {
  account: {
    title: "Conta",
    description: "Configure os dados da sua loja e posicionamento.",
    tooltip: "Esses dados orientam o tom do roteiro e copy da capa."
  },
  instagram: {
    title: "Instagram",
    description: "Defina usuario, conexao e melhor horario de postagem.",
    tooltip: "Usamos isso para publicar e agendar sem friccao."
  },
  branding: {
    title: "Branding",
    description: "Escolha cores e estilo visual do seu reel.",
    tooltip: "Sua identidade fica consistente em todo conteudo gerado."
  },
  voice: {
    title: "Voz",
    description: "Selecione provedor, voz e estilo de narracao.",
    tooltip: "A voz impacta retencao e percepcao de autoridade."
  },
  plan: {
    title: "Plano",
    description: "Escolha o plano recomendado para seu volume.",
    tooltip: "Essa escolha define limites e recursos disponiveis."
  }
};

export function onboardingProgress(step: OnboardingStep): number {
  return (ONBOARDING_STEPS.indexOf(step) + 1) * 20;
}

export function stepByIndex(index: number): OnboardingStep {
  return ONBOARDING_STEPS[Math.max(0, Math.min(index, ONBOARDING_STEPS.length - 1))];
}
