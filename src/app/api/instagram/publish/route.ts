import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { publishReelNow, updatePublishedCaption } from "@/lib/instagram/publish";

const publishBodySchema = z.object({
  reelId: z.string().uuid()
});

const editBodySchema = z.object({
  publicationId: z.string().uuid(),
  caption: z.string().min(5)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = publishBodySchema.parse(body);
    const { tenantId, userId } = await getCurrentTenantContext();

    const result = await publishReelNow({
      tenantId,
      userId,
      reelId: payload.reelId
    });

    return NextResponse.json({
      ok: true,
      publicationId: result.publicationId,
      mediaId: result.instagramMediaId,
      permalink: result.permalink
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao publicar"
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const payload = editBodySchema.parse(body);
    const { tenantId } = await getCurrentTenantContext();

    await updatePublishedCaption({
      tenantId,
      publicationId: payload.publicationId,
      caption: payload.caption
    });

    return NextResponse.json({
      ok: true,
      publicationId: payload.publicationId
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha ao editar legenda"
      },
      { status: 400 }
    );
  }
}
