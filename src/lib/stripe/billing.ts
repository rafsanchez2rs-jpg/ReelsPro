import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { clientEnv, serverEnv } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe/client";

export type PlanTier = "free" | "pro" | "enterprise";

export interface TenantPlanSnapshot {
  planTier: PlanTier;
  status: string;
  maxReelsPerMonth: number;
  reelsGeneratedThisMonth: number;
}

function monthReferenceDate(): string {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return first.toISOString().slice(0, 10);
}

function priceEnvForTier(tier: PlanTier): string | undefined {
  if (tier === "pro") return serverEnv.STRIPE_PRICE_PRO;
  if (tier === "enterprise") return serverEnv.STRIPE_PRICE_ENTERPRISE;
  return serverEnv.STRIPE_PRICE_FREE;
}

async function ensureUsageCounter(tenantId: string): Promise<void> {
  const refMonth = monthReferenceDate();

  const { error } = await supabaseAdmin
    .from("usage_counters_monthly")
    .upsert({ tenant_id: tenantId, ref_month: refMonth }, { onConflict: "tenant_id,ref_month" });

  if (error) {
    throw new Error(`Falha ao garantir contador mensal: ${error.message}`);
  }
}

export async function getTenantPlanSnapshot(tenantId: string): Promise<TenantPlanSnapshot> {
  await ensureUsageCounter(tenantId);

  const refMonth = monthReferenceDate();

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("plan_tier,status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(`Falha ao buscar assinatura: ${subscriptionError.message}`);
  }

  const planTier = (subscription?.plan_tier ?? "free") as PlanTier;

  const { data: plan, error: planError } = await supabaseAdmin
    .from("subscription_plans")
    .select("max_reels_per_month")
    .eq("tier", planTier)
    .single();

  if (planError) {
    throw new Error(`Falha ao buscar plano: ${planError.message}`);
  }

  const { data: usage, error: usageError } = await supabaseAdmin
    .from("usage_counters_monthly")
    .select("reels_generated_count")
    .eq("tenant_id", tenantId)
    .eq("ref_month", refMonth)
    .single();

  if (usageError) {
    throw new Error(`Falha ao buscar uso mensal: ${usageError.message}`);
  }

  return {
    planTier,
    status: subscription?.status ?? "incomplete",
    maxReelsPerMonth: Number(plan.max_reels_per_month ?? 0),
    reelsGeneratedThisMonth: Number(usage.reels_generated_count ?? 0)
  };
}

export async function enforceReelGenerationLimit(tenantId: string): Promise<void> {
  const snapshot = await getTenantPlanSnapshot(tenantId);

  if (snapshot.planTier === "enterprise") {
    return;
  }

  if (snapshot.reelsGeneratedThisMonth >= snapshot.maxReelsPerMonth) {
    throw new Error(
      `Limite do plano atingido (${snapshot.reelsGeneratedThisMonth}/${snapshot.maxReelsPerMonth} reels no mes). Faça upgrade.`
    );
  }
}

export async function incrementUsageCounter(input: {
  tenantId: string;
  generatedDelta?: number;
  publishedDelta?: number;
  voiceCharsDelta?: number;
}): Promise<void> {
  await ensureUsageCounter(input.tenantId);
  const refMonth = monthReferenceDate();

  const { data: current, error: currentError } = await supabaseAdmin
    .from("usage_counters_monthly")
    .select("reels_generated_count,reels_published_count,voice_chars_used")
    .eq("tenant_id", input.tenantId)
    .eq("ref_month", refMonth)
    .single();

  if (currentError || !current) {
    throw new Error(`Falha ao carregar contador atual: ${currentError?.message ?? "erro desconhecido"}`);
  }

  const nextGenerated = Number(current.reels_generated_count ?? 0) + Number(input.generatedDelta ?? 0);
  const nextPublished = Number(current.reels_published_count ?? 0) + Number(input.publishedDelta ?? 0);
  const nextChars = Number(current.voice_chars_used ?? 0) + Number(input.voiceCharsDelta ?? 0);

  const { error: updateError } = await supabaseAdmin
    .from("usage_counters_monthly")
    .update({
      reels_generated_count: nextGenerated,
      reels_published_count: nextPublished,
      voice_chars_used: nextChars
    })
    .eq("tenant_id", input.tenantId)
    .eq("ref_month", refMonth);

  if (updateError) {
    throw new Error(`Falha ao atualizar contador mensal: ${updateError.message}`);
  }
}

export async function createCheckoutSession(input: {
  tenantId: string;
  userId: string;
  userEmail?: string;
  planTier: Exclude<PlanTier, "free">;
}): Promise<{ url: string }> {
  const stripe = getStripeServerClient();

  const priceId = priceEnvForTier(input.planTier);
  if (!priceId) {
    throw new Error(`Price ID nao configurado para o plano ${input.planTier}`);
  }

  const { data: existingSubscription } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", input.tenantId)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingSubscription?.stripe_customer_id ?? undefined,
    customer_email: existingSubscription?.stripe_customer_id ? undefined : input.userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
    cancel_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/settings?billing=cancel`,
    metadata: {
      tenant_id: input.tenantId,
      user_id: input.userId,
      plan_tier: input.planTier
    },
    allow_promotion_codes: true
  });

  if (!session.url) {
    throw new Error("Stripe nao retornou URL de checkout");
  }

  return { url: session.url };
}

export async function createBillingPortalSession(tenantId: string): Promise<{ url: string }> {
  const stripe = getStripeServerClient();

  const { data: subscription, error } = await supabaseAdmin
    .from("tenant_subscriptions")
    .select("stripe_customer_id")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !subscription?.stripe_customer_id) {
    throw new Error(`Tenant sem customer Stripe associado: ${error?.message ?? "ausente"}`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${clientEnv.NEXT_PUBLIC_APP_URL}/settings`
  });

  return { url: session.url };
}

export async function syncStripeSubscriptionById(subscriptionId: string): Promise<void> {
  const stripe = getStripeServerClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const tenantId =
    subscription.metadata?.tenant_id ||
    subscription.items.data[0]?.price.metadata?.tenant_id ||
    undefined;

  if (!tenantId) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const { data: tenantSubscription, error: tenantLookupError } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("tenant_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (tenantLookupError || !tenantSubscription?.tenant_id) {
      throw new Error("Nao foi possivel identificar tenant para sync da assinatura");
    }

    await upsertTenantSubscriptionFromStripe(tenantSubscription.tenant_id, subscription);
    return;
  }

  await upsertTenantSubscriptionFromStripe(tenantId, subscription);
}

export async function upsertTenantSubscriptionFromStripe(
  tenantId: string,
  subscription: {
    id: string;
    status: string;
    customer: string | { id: string };
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    items: {
      data: Array<{
        price: {
          id: string;
        };
      }>;
    };
  }
): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const stripePriceId = subscription.items.data[0]?.price.id ?? null;

  let planTier: PlanTier = "free";

  const priceMap = new Map<string, PlanTier>();
  if (serverEnv.STRIPE_PRICE_PRO) priceMap.set(serverEnv.STRIPE_PRICE_PRO, "pro");
  if (serverEnv.STRIPE_PRICE_ENTERPRISE) priceMap.set(serverEnv.STRIPE_PRICE_ENTERPRISE, "enterprise");
  if (serverEnv.STRIPE_PRICE_FREE) priceMap.set(serverEnv.STRIPE_PRICE_FREE, "free");

  if (stripePriceId && priceMap.has(stripePriceId)) {
    planTier = priceMap.get(stripePriceId) ?? "free";
  }

  const status = subscription.status;

  const { error } = await supabaseAdmin.from("tenant_subscriptions").upsert(
    {
      tenant_id: tenantId,
      plan_tier: planTier,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    },
    { onConflict: "tenant_id" }
  );

  if (error) {
    throw new Error(`Falha ao sincronizar assinatura no Supabase: ${error.message}`);
  }
}

export async function ensureTenantBillingRow(tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("tenant_subscriptions").upsert(
    {
      tenant_id: tenantId,
      plan_tier: "free",
      status: "incomplete"
    },
    { onConflict: "tenant_id" }
  );

  if (error) {
    throw new Error(`Falha ao garantir tenant_subscriptions: ${error.message}`);
  }
}

export async function getCurrentUserBillingOverview(): Promise<{
  planTier: PlanTier;
  status: string;
  maxReelsPerMonth: number;
  reelsGeneratedThisMonth: number;
}> {
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
    .single();

  if (!profile?.default_tenant_id) {
    throw new Error("Usuario sem tenant padrao");
  }

  const snapshot = await getTenantPlanSnapshot(profile.default_tenant_id);

  return {
    planTier: snapshot.planTier,
    status: snapshot.status,
    maxReelsPerMonth: snapshot.maxReelsPerMonth,
    reelsGeneratedThisMonth: snapshot.reelsGeneratedThisMonth
  };
}
