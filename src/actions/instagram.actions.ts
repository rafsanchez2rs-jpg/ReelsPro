"use server";

import { z } from "zod";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { publishReelNow, scheduleReelPublication, updatePublishedCaption } from "@/lib/instagram/publish";
import { syncReelInsights } from "@/lib/instagram/insights";

const publishSchema = z.object({
  reelId: z.string().uuid()
});

const scheduleSchema = z.object({
  reelId: z.string().uuid(),
  scheduledFor: z.string().min(16)
});

const editSchema = z.object({
  publicationId: z.string().uuid(),
  caption: z.string().min(5)
});

const insightsSchema = z.object({
  reelId: z.string().uuid()
});

export interface InstagramActionState {
  success: boolean;
  message: string;
  publicationId?: string;
  mediaId?: string;
  permalink?: string;
}

export const INSTAGRAM_ACTION_INITIAL_STATE: InstagramActionState = {
  success: false,
  message: ""
};

export async function publishReelNowAction(
  _prev: InstagramActionState,
  formData: FormData
): Promise<InstagramActionState> {
  try {
    const { tenantId, userId } = await getCurrentTenantContext();
    const payload = publishSchema.parse({
      reelId: String(formData.get("reelId") ?? "")
    });

    const result = await publishReelNow({
      tenantId,
      userId,
      reelId: payload.reelId
    });

    return {
      success: true,
      message: "Reel publicado com sucesso no Instagram.",
      publicationId: result.publicationId,
      mediaId: result.instagramMediaId,
      permalink: result.permalink
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao publicar reel"
    };
  }
}

export async function scheduleReelAction(
  _prev: InstagramActionState,
  formData: FormData
): Promise<InstagramActionState> {
  try {
    const { tenantId, userId } = await getCurrentTenantContext();
    const payload = scheduleSchema.parse({
      reelId: String(formData.get("reelId") ?? ""),
      scheduledFor: String(formData.get("scheduledFor") ?? "")
    });

    const scheduledDate = new Date(payload.scheduledFor);

    if (Number.isNaN(scheduledDate.getTime())) {
      throw new Error("Data/hora de agendamento invalida");
    }

    const result = await scheduleReelPublication({
      tenantId,
      userId,
      reelId: payload.reelId,
      scheduledForIso: scheduledDate.toISOString()
    });

    return {
      success: true,
      message: "Publicacao agendada com sucesso.",
      publicationId: result.publicationId
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao agendar"
    };
  }
}

export async function editPublishedCaptionAction(
  _prev: InstagramActionState,
  formData: FormData
): Promise<InstagramActionState> {
  try {
    const { tenantId } = await getCurrentTenantContext();
    const payload = editSchema.parse({
      publicationId: String(formData.get("publicationId") ?? ""),
      caption: String(formData.get("caption") ?? "")
    });

    await updatePublishedCaption({
      tenantId,
      publicationId: payload.publicationId,
      caption: payload.caption
    });

    return {
      success: true,
      message: "Legenda atualizada no Instagram com sucesso.",
      publicationId: payload.publicationId
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao editar legenda"
    };
  }
}

export async function syncReelInsightsAction(
  _prev: InstagramActionState,
  formData: FormData
): Promise<InstagramActionState> {
  try {
    const { tenantId } = await getCurrentTenantContext();
    const payload = insightsSchema.parse({
      reelId: String(formData.get("reelId") ?? "")
    });

    const result = await syncReelInsights({
      tenantId,
      reelId: payload.reelId
    });

    return {
      success: true,
      message: `Metricas sincronizadas (${result.metricDate}) com sucesso.`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Falha ao sincronizar metricas"
    };
  }
}
