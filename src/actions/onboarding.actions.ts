"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveOnboardingProgress(
  userId: string,
  step: number,
  stepData: Record<string, unknown>,
  completed: boolean = false
) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("onboarding_progress").upsert(
    {
      user_id: userId,
      current_step: step,
      step_data: stepData,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Erro ao salvar progresso:", error);
    throw new Error("Falha ao salvar progresso do onboarding");
  }

  return { success: true };
}

export async function getOnboardingProgress(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar progresso:", error);
    throw new Error("Falha ao buscar progresso");
  }

  return data || null;
}

export async function completeOnboarding(userId: string, fullName: string, preferences: Record<string, unknown>) {
  const supabase = await createServerSupabaseClient();

  const { error: profileError } = await supabase.from("users").update({
    full_name: fullName,
    preferences,
    updated_at: new Date().toISOString()
  }).eq("id", userId);

  if (profileError) {
    console.error("Erro ao atualizar perfil:", profileError);
    throw new Error("Falha ao completar onboarding");
  }

  await saveOnboardingProgress(userId, 3, preferences, true);

  return { success: true };
}