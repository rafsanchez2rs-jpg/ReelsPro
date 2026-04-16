"use server";

import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import os from "node:os";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { uploadProductSchema } from "@/lib/validation/reel.schema";
import { extractProductDataFromImage, generateReelDraftFromAnalysis } from "@/lib/vision/extract-product-data";
import { buildThumbnailHeadline } from "@/lib/video/thumbnail";
import { synthesizeNarration } from "@/lib/voice";
import { renderReelVideo } from "@/lib/video/render-reel";
import { enforceReelGenerationLimit, incrementUsageCounter } from "@/lib/stripe/billing";

export interface ReelGenerationActionState {
  success: boolean;
  message: string;
  reelId?: string;
  assetId?: string;
  analysisId?: string;
  imageUrl?: string;
  analysis?: {
    productName: string;
    price: number;
    description: string;
    benefits: string[];
    attributes: Record<string, string>;
    confidence: number;
  };
  draft?: {
    title: string;
    hookText: string;
    caption: string;
    narrationScript: string;
    durationSeconds: number;
    hashtags: string[];
    overlays: Array<{
      sequence: number;
      text: string;
      animation: string;
      startMs: number;
      endMs: number;
    }>;
    trendingAudioLabel: string;
    thumbnailHeadline: string;
  };
}

export interface ReelEditorActionState {
  success: boolean;
  message: string;
  reelId?: string;
  draftId?: string;
  videoStoragePath?: string;
  videoSignedUrl?: string;
  audioStoragePath?: string;
}

export const REEL_GENERATION_INITIAL_STATE: ReelGenerationActionState = {
  success: false,
  message: ""
};

export const REEL_EDITOR_INITIAL_STATE: ReelEditorActionState = {
  success: false,
  message: ""
};

const reelEditSchema = z.object({
  reelId: z.string().uuid(),
  hookText: z.string().min(5),
  caption: z.string().min(10),
  narrationScript: z.string().min(20),
  thumbnailHeadline: z.string().min(5),
  overlaysJson: z.string().min(2)
});

const renderSchema = reelEditSchema.extend({
  voiceProvider: z.enum(["elevenlabs", "cartesia"]).default("elevenlabs"),
  voiceId: z.string().min(2),
  narrationSpeed: z.coerce.number().min(0.7).max(1.4).default(1)
});

function getExtension(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function parseOverlays(overlaysJson: string) {
  const parsed = JSON.parse(overlaysJson) as Array<{
    sequence: number;
    text: string;
    animation: string;
    startMs: number;
    endMs: number;
  }>;

  return parsed
    .map((overlay, index) => ({
      sequence: Number(overlay.sequence ?? index + 1),
      text: String(overlay.text ?? "").slice(0, 90),
      animation: String(overlay.animation ?? "slide-up"),
      startMs: Number(overlay.startMs ?? 0),
      endMs: Number(overlay.endMs ?? 1000)
    }))
    .filter((overlay) => overlay.text.length > 0)
    .sort((a, b) => a.sequence - b.sequence);
}

export async function createReelFromUploadAction(
  _prevState: ReelGenerationActionState,
  formData: FormData
): Promise<ReelGenerationActionState> {
  try {
    const file = formData.get("productFile");

    if (!(file instanceof File)) {
      return {
        success: false,
        message: "Selecione uma imagem valida para continuar"
      };
    }

    const validation = uploadProductSchema.safeParse({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    });

    if (!validation.success) {
      return {
        success: false,
        message: "Arquivo invalido. Use JPG, PNG ou WEBP ate 10MB"
      };
    }

    const { userId, tenantId } = await getCurrentTenantContext();
    await enforceReelGenerationLimit(tenantId);
    const supabase = await createServerSupabaseClient();

    const extension = getExtension(file.type);
    const storagePath = `${tenantId}/products/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("reelshopee-assets")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return {
        success: false,
        message: `Falha no upload da imagem: ${uploadError.message}`
      };
    }

    const { data: assetRow, error: assetError } = await supabase
      .from("product_assets")
      .insert({
        tenant_id: tenantId,
        uploaded_by: userId,
        storage_path: storagePath,
        kind: "product_photo",
        mime_type: file.type,
        size_bytes: file.size
      })
      .select("id")
      .single();

    if (assetError || !assetRow) {
      return {
        success: false,
        message: `Falha ao registrar asset: ${assetError?.message ?? "erro desconhecido"}`
      };
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("reelshopee-assets")
      .createSignedUrl(storagePath, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      return {
        success: false,
        message: `Falha ao gerar URL para analise: ${signedError?.message ?? "erro desconhecido"}`
      };
    }

    const analysis = await extractProductDataFromImage(signedData.signedUrl);

    const { data: analysisRow, error: analysisError } = await supabase
      .from("product_analyses")
      .insert({
        tenant_id: tenantId,
        asset_id: assetRow.id,
        model_name: process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "fallback-heuristic",
        product_name: analysis.productName,
        product_price: analysis.price,
        currency: "BRL",
        short_description: analysis.description,
        benefits: analysis.benefits,
        attributes: analysis.attributes,
        confidence_score: analysis.confidence,
        raw_vision_response: analysis
      })
      .select("id")
      .single();

    if (analysisError || !analysisRow) {
      return {
        success: false,
        message: `Falha ao salvar analise: ${analysisError?.message ?? "erro desconhecido"}`
      };
    }

    const draft = await generateReelDraftFromAnalysis(analysis);
    const thumbnailHeadline = buildThumbnailHeadline(analysis.productName, analysis.price);

    const { data: reelRow, error: reelError } = await supabase
      .from("reels")
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        title: draft.title,
        status: "generated",
        source_asset_id: assetRow.id,
        analysis_id: analysisRow.id,
        hook_text: draft.hookText,
        caption: draft.caption,
        hashtags: draft.hashtags,
        narration_script: draft.narrationScript,
        duration_seconds: draft.durationSeconds,
        trending_audio_label: draft.trendingAudioLabel,
        edit_payload: {
          thumbnailHeadline,
          overlays: draft.overlays
        }
      })
      .select("id")
      .single();

    if (reelError || !reelRow) {
      return {
        success: false,
        message: `Falha ao criar reel: ${reelError?.message ?? "erro desconhecido"}`
      };
    }

    const overlaysToInsert = draft.overlays.map((overlay) => ({
      tenant_id: tenantId,
      reel_id: reelRow.id,
      sequence: overlay.sequence,
      text_content: overlay.text,
      animation: overlay.animation,
      start_ms: overlay.startMs,
      end_ms: overlay.endMs,
      style: {}
    }));

    const { error: overlayError } = await supabase.from("reel_overlays").insert(overlaysToInsert);

    if (overlayError) {
      return {
        success: false,
        message: `Reel criado, mas falhou ao salvar overlays: ${overlayError.message}`
      };
    }

    await incrementUsageCounter({
      tenantId,
      generatedDelta: 1
    });

    return {
      success: true,
      message: "Reel gerado com sucesso. Voce ja pode revisar e editar o draft.",
      reelId: reelRow.id,
      assetId: assetRow.id,
      analysisId: analysisRow.id,
      imageUrl: signedData.signedUrl,
      analysis,
      draft: {
        ...draft,
        thumbnailHeadline
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado na geracao"
    };
  }
}

export async function saveReelDraftAction(
  _prevState: ReelEditorActionState,
  formData: FormData
): Promise<ReelEditorActionState> {
  try {
    const { tenantId, userId } = await getCurrentTenantContext();
    const supabase = await createServerSupabaseClient();

    const payload = reelEditSchema.parse({
      reelId: String(formData.get("reelId") ?? ""),
      hookText: String(formData.get("hookText") ?? ""),
      caption: String(formData.get("caption") ?? ""),
      narrationScript: String(formData.get("narrationScript") ?? ""),
      thumbnailHeadline: String(formData.get("thumbnailHeadline") ?? ""),
      overlaysJson: String(formData.get("overlaysJson") ?? "[]")
    });

    const overlays = parseOverlays(payload.overlaysJson);

    const { error: updateReelError } = await supabase
      .from("reels")
      .update({
        hook_text: payload.hookText,
        caption: payload.caption,
        narration_script: payload.narrationScript,
        status: "draft",
        edit_payload: {
          thumbnailHeadline: payload.thumbnailHeadline,
          overlays
        }
      })
      .eq("id", payload.reelId)
      .eq("tenant_id", tenantId);

    if (updateReelError) {
      throw new Error(`Falha ao atualizar reel: ${updateReelError.message}`);
    }

    const { error: deleteOverlayError } = await supabase
      .from("reel_overlays")
      .delete()
      .eq("reel_id", payload.reelId)
      .eq("tenant_id", tenantId);

    if (deleteOverlayError) {
      throw new Error(`Falha ao limpar overlays antigas: ${deleteOverlayError.message}`);
    }

    if (overlays.length > 0) {
      const overlayRows = overlays.map((overlay, index) => ({
        tenant_id: tenantId,
        reel_id: payload.reelId,
        sequence: index + 1,
        text_content: overlay.text,
        animation: overlay.animation,
        start_ms: overlay.startMs,
        end_ms: overlay.endMs,
        style: {}
      }));

      const { error: insertOverlayError } = await supabase.from("reel_overlays").insert(overlayRows);

      if (insertOverlayError) {
        throw new Error(`Falha ao inserir overlays atualizadas: ${insertOverlayError.message}`);
      }
    }

    const { data: draftRow, error: draftError } = await supabase
      .from("reel_drafts")
      .upsert(
        {
          tenant_id: tenantId,
          reel_id: payload.reelId,
          draft_payload: {
            hookText: payload.hookText,
            caption: payload.caption,
            narrationScript: payload.narrationScript,
            thumbnailHeadline: payload.thumbnailHeadline,
            overlays
          },
          created_by: userId
        },
        { onConflict: "reel_id" }
      )
      .select("id")
      .single();

    if (draftError || !draftRow) {
      throw new Error(`Falha ao salvar rascunho: ${draftError?.message ?? "erro desconhecido"}`);
    }

    return {
      success: true,
      message: "Rascunho salvo com sucesso.",
      reelId: payload.reelId,
      draftId: draftRow.id
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao salvar rascunho"
    };
  }
}

export async function renderReelAssetsAction(
  _prevState: ReelEditorActionState,
  formData: FormData
): Promise<ReelEditorActionState> {
  let audioTempPath: string | null = null;
  let videoTempPath: string | null = null;

  try {
    const { tenantId } = await getCurrentTenantContext();
    const supabase = await createServerSupabaseClient();

    const payload = renderSchema.parse({
      reelId: String(formData.get("reelId") ?? ""),
      hookText: String(formData.get("hookText") ?? ""),
      caption: String(formData.get("caption") ?? ""),
      narrationScript: String(formData.get("narrationScript") ?? ""),
      thumbnailHeadline: String(formData.get("thumbnailHeadline") ?? ""),
      overlaysJson: String(formData.get("overlaysJson") ?? "[]"),
      voiceProvider: String(formData.get("voiceProvider") ?? "elevenlabs"),
      voiceId: String(formData.get("voiceId") ?? ""),
      narrationSpeed: String(formData.get("narrationSpeed") ?? "1")
    });

    const overlays = parseOverlays(payload.overlaysJson);

    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("id,source_asset_id,duration_seconds")
      .eq("id", payload.reelId)
      .eq("tenant_id", tenantId)
      .single();

    if (reelError || !reel) {
      throw new Error(`Reel nao encontrado: ${reelError?.message ?? "erro desconhecido"}`);
    }

    const { data: asset, error: assetError } = await supabase
      .from("product_assets")
      .select("storage_path")
      .eq("id", reel.source_asset_id)
      .eq("tenant_id", tenantId)
      .single();

    if (assetError || !asset?.storage_path) {
      throw new Error(`Asset de origem nao encontrado: ${assetError?.message ?? "erro desconhecido"}`);
    }

    const { data: productImageSigned, error: imageSignedError } = await supabase.storage
      .from("reelshopee-assets")
      .createSignedUrl(asset.storage_path, 60 * 60);

    if (imageSignedError || !productImageSigned?.signedUrl) {
      throw new Error(`Falha ao gerar URL da imagem: ${imageSignedError?.message ?? "erro desconhecido"}`);
    }

    const audioBuffer = await synthesizeNarration({
      provider: payload.voiceProvider,
      voiceId: payload.voiceId,
      script: payload.narrationScript,
      speed: payload.narrationSpeed
    });

    const audioFileName = `narration-${Date.now()}-${randomUUID()}.mp3`;
    audioTempPath = path.join(os.tmpdir(), audioFileName);
    await fs.writeFile(audioTempPath, audioBuffer);

    const audioStoragePath = `${tenantId}/reels/${payload.reelId}/${audioFileName}`;
    const { error: audioUploadError } = await supabase.storage
      .from("reelshopee-assets")
      .upload(audioStoragePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true
      });

    if (audioUploadError) {
      throw new Error(`Falha ao enviar audio: ${audioUploadError.message}`);
    }

    const { data: audioSigned, error: audioSignedError } = await supabase.storage
      .from("reelshopee-assets")
      .createSignedUrl(audioStoragePath, 60 * 60);

    if (audioSignedError || !audioSigned?.signedUrl) {
      throw new Error(`Falha ao assinar URL de audio: ${audioSignedError?.message ?? "erro desconhecido"}`);
    }

    const renderResult = await renderReelVideo({
      props: {
        productImageUrl: productImageSigned.signedUrl,
        thumbnailHeadline: payload.thumbnailHeadline,
        hookText: payload.hookText,
        caption: payload.caption,
        overlays,
        narrationAudioUrl: audioSigned.signedUrl,
        durationSeconds: Math.max(15, Math.min(30, Number(reel.duration_seconds ?? 20)))
      },
      outputFileName: `reel-${payload.reelId}.mp4`
    });

    videoTempPath = renderResult.filePath;
    const videoBuffer = await fs.readFile(renderResult.filePath);

    const videoStoragePath = `${tenantId}/reels/${payload.reelId}/rendered-${Date.now()}-${randomUUID()}.mp4`;
    const { error: videoUploadError } = await supabase.storage
      .from("reelshopee-assets")
      .upload(videoStoragePath, videoBuffer, {
        contentType: "video/mp4",
        upsert: true
      });

    if (videoUploadError) {
      throw new Error(`Falha ao enviar video renderizado: ${videoUploadError.message}`);
    }

    const { error: audioTrackError } = await supabase.from("reel_audio_tracks").insert({
      tenant_id: tenantId,
      reel_id: payload.reelId,
      provider: payload.voiceProvider,
      provider_voice_id: payload.voiceId,
      script: payload.narrationScript,
      storage_path: audioStoragePath,
      chars_count: payload.narrationScript.length
    });

    if (audioTrackError) {
      throw new Error(`Falha ao registrar faixa de audio: ${audioTrackError.message}`);
    }

    const { error: reelUpdateError } = await supabase
      .from("reels")
      .update({
        status: "review_pending",
        hook_text: payload.hookText,
        caption: payload.caption,
        narration_script: payload.narrationScript,
        voice_provider: payload.voiceProvider,
        voice_id: payload.voiceId,
        video_storage_path: videoStoragePath,
        edit_payload: {
          thumbnailHeadline: payload.thumbnailHeadline,
          overlays
        }
      })
      .eq("id", payload.reelId)
      .eq("tenant_id", tenantId);

    if (reelUpdateError) {
      throw new Error(`Falha ao atualizar reel apos render: ${reelUpdateError.message}`);
    }

    await incrementUsageCounter({
      tenantId,
      voiceCharsDelta: payload.narrationScript.length
    });

    const { data: videoSigned } = await supabase.storage
      .from("reelshopee-assets")
      .createSignedUrl(videoStoragePath, 60 * 60);

    return {
      success: true,
      message: "Render concluido. Video pronto para revisao e publicacao.",
      reelId: payload.reelId,
      videoStoragePath,
      videoSignedUrl: videoSigned?.signedUrl,
      audioStoragePath
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao renderizar ativos"
    };
  } finally {
    if (audioTempPath) {
      await fs.rm(audioTempPath, { force: true });
    }

    if (videoTempPath) {
      await fs.rm(videoTempPath, { force: true });
    }
  }
}
