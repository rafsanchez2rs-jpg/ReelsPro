import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { createCheckoutSession, ensureTenantBillingRow } from "@/lib/stripe/billing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  planTier: z.enum(["pro", "enterprise"])
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = bodySchema.parse(body);

    const { tenantId, userId } = await getCurrentTenantContext();
    await ensureTenantBillingRow(tenantId);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const session = await createCheckoutSession({
      tenantId,
      userId,
      userEmail: user?.email,
      planTier: payload.planTier
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha no checkout"
      },
      { status: 400 }
    );
  }
}
