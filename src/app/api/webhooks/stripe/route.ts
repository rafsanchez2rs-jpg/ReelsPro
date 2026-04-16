import Stripe from "stripe";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncStripeSubscriptionById, upsertTenantSubscriptionFromStripe } from "@/lib/stripe/billing";

export const runtime = "nodejs";

function extractTenantIdFromSessionMetadata(session: Stripe.Checkout.Session): string | undefined {
  if (session.metadata?.tenant_id) {
    return session.metadata.tenant_id;
  }

  if (session.subscription && typeof session.subscription === "string") {
    return undefined;
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, message: "STRIPE_WEBHOOK_SECRET nao configurado" }, { status: 500 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, message: "Assinatura Stripe ausente" }, { status: 400 });
    }

    const rawBody = await request.text();
    const stripe = getStripeServerClient();

    const event = stripe.webhooks.constructEvent(rawBody, signature, serverEnv.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const tenantId = extractTenantIdFromSessionMetadata(session);

      if (subscriptionId) {
        if (tenantId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertTenantSubscriptionFromStripe(tenantId, subscription);
        } else {
          await syncStripeSubscriptionById(subscriptionId);
        }
      } else if (tenantId && customerId) {
        await supabaseAdmin.from("tenant_subscriptions").upsert(
          {
            tenant_id: tenantId,
            stripe_customer_id: customerId,
            status: "incomplete"
          },
          { onConflict: "tenant_id" }
        );
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncStripeSubscriptionById(subscription.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Erro ao processar webhook"
      },
      { status: 400 }
    );
  }
}
