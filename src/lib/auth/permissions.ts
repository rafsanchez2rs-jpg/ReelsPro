import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CurrentTenantContext {
  userId: string;
  tenantId: string;
  role: "owner" | "admin" | "editor" | "analyst";
}

export async function getCurrentTenantContext(): Promise<CurrentTenantContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  let tenantId = profile?.default_tenant_id ?? null;

  const membershipQuery = supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!tenantId) {
    const { data: membership } = await membershipQuery;
    tenantId = membership?.tenant_id ?? null;
  }

  if (!tenantId) {
    throw new Error("Nenhum tenant associado ao usuario");
  }

  const { data: activeMembership } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!activeMembership?.role) {
    throw new Error("Usuario sem permissao no tenant");
  }

  return {
    userId: user.id,
    tenantId,
    role: activeMembership.role
  };
}
