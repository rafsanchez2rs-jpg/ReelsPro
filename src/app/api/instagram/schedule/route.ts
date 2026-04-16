import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { scheduleReelPublication } from "@/lib/instagram/publish";

const bodySchema = z.object({
  reelId: z.string().uuid(),
  scheduledFor: z.string().datetime()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = bodySchema.parse(body);
    const { tenantId, userId } = await getCurrentTenantContext();

    const result = await scheduleReelPublication({
      tenantId,
      userId,
      reelId: payload.reelId,
      scheduledForIso: payload.scheduledFor
    });

    return NextResponse.json({
      ok: true,
      publicationId: result.publicationId
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao agendar"
      },
      { status: 400 }
    );
  }
}
