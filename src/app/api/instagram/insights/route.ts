import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { syncReelInsights } from "@/lib/instagram/insights";

const bodySchema = z.object({
  reelId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = bodySchema.parse(body);
    const { tenantId } = await getCurrentTenantContext();

    const result = await syncReelInsights({
      tenantId,
      reelId: payload.reelId
    });

    return NextResponse.json({
      ok: true,
      metrics: result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao sincronizar metricas"
      },
      { status: 400 }
    );
  }
}
