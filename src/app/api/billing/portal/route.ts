import { NextResponse } from "next/server";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { createBillingPortalSession } from "@/lib/stripe/billing";

export async function POST() {
  try {
    const { tenantId } = await getCurrentTenantContext();
    const portal = await createBillingPortalSession(tenantId);

    return NextResponse.json({
      ok: true,
      portalUrl: portal.url
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha no portal"
      },
      { status: 400 }
    );
  }
}
