"use server";

import { redirect } from "next/navigation";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import {
  createBillingPortalSession,
  createCheckoutSession,
  ensureTenantBillingRow,
  getCurrentUserBillingOverview
} from "@/lib/stripe/billing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface BillingActionState {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  portalUrl?: string;
}

export const BILLING_INITIAL_STATE: BillingActionState = {
  success: false,
  message: ""
};

export async function startUpgradeCheckoutAction(
  _prev: BillingActionState,
  formData: FormData
): Promise<BillingActionState> {
  try {
    const requestedPlan = String(formData.get("planTier") ?? "");
    if (requestedPlan !== "pro" && requestedPlan !== "enterprise") {
      return { success: false, message: "Plano invalido para upgrade" };
    }

    const { tenantId, userId } = await getCurrentTenantContext();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    await ensureTenantBillingRow(tenantId);

    const session = await createCheckoutSession({
      tenantId,
      userId,
      userEmail: user?.email,
      planTier: requestedPlan
    });

    return {
      success: true,
      message: "Redirecionando para checkout Stripe...",
      checkoutUrl: session.url
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao iniciar checkout"
    };
  }
}

export async function openBillingPortalAction(
  _prev: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  try {
    const { tenantId } = await getCurrentTenantContext();
    const portal = await createBillingPortalSession(tenantId);

    return {
      success: true,
      message: "Abrindo portal de faturamento...",
      portalUrl: portal.url
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao abrir portal"
    };
  }
}

export async function redirectToCheckout(url: string) {
  redirect(url);
}

export async function getBillingOverviewAction() {
  return getCurrentUserBillingOverview();
}
