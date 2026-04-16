import { NextResponse } from "next/server";
import { renderReelAssetsAction, REEL_EDITOR_INITIAL_STATE } from "@/actions/reels.actions";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      reelId?: string;
      hookText?: string;
      caption?: string;
      narrationScript?: string;
      thumbnailHeadline?: string;
      overlaysJson?: string;
      voiceProvider?: string;
      voiceId?: string;
      narrationSpeed?: number;
    };

    const formData = new FormData();
    formData.set("reelId", body.reelId ?? "");
    formData.set("hookText", body.hookText ?? "");
    formData.set("caption", body.caption ?? "");
    formData.set("narrationScript", body.narrationScript ?? "");
    formData.set("thumbnailHeadline", body.thumbnailHeadline ?? "");
    formData.set("overlaysJson", body.overlaysJson ?? "[]");
    formData.set("voiceProvider", body.voiceProvider ?? "elevenlabs");
    formData.set("voiceId", body.voiceId ?? "pt-br-feminina-comercial-01");
    formData.set("narrationSpeed", String(body.narrationSpeed ?? 1));

    const result = await renderReelAssetsAction(REEL_EDITOR_INITIAL_STATE, formData);

    if (!result.success) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      reelId: result.reelId,
      videoStoragePath: result.videoStoragePath,
      videoSignedUrl: result.videoSignedUrl,
      audioStoragePath: result.audioStoragePath
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Falha no endpoint de render"
      },
      { status: 500 }
    );
  }
}
