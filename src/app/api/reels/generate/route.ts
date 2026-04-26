import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/vision/extract-product-data";
import { generateThumbnail } from "@/lib/video/thumbnail";
import { generateScript } from "@/lib/ai/script-generator";

interface GenerateReelRequest {
  imageUrl: string;
  userId: string;
  preferences?: {
    brandName?: string;
    brandColor?: string;
    accentPhrase?: string;
    voiceMode?: "text" | "elevenlabs" | "cartesia";
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateReelRequest = await request.json();
    const { imageUrl, userId, preferences } = body;

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    const skipPersistence = userId === "anonymous";

    let supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerSupabaseClient>> | null = null;
    if (!skipPersistence) {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server");
      supabase = await createServerSupabaseClient();
    }

    let assetId: string | undefined;
    if (!skipPersistence && supabase) {
      const { data: asset, error: assetError } = await supabase
        .from("product_assets")
        .insert({
          user_id: userId,
          storage_path: `uploads/${userId}/${Date.now()}.jpg`,
          mime_type: "image/jpeg",
          size_bytes: 0
        })
        .select()
        .single();

      if (assetError) {
        console.error("Erro ao criar asset:", assetError);
        return NextResponse.json(
          { error: "Falha ao processar upload" },
          { status: 500 }
        );
      }
      assetId = asset.id;
    }

    const analysis = await analyzeProduct({ imageUrl });
    const brandColor = preferences?.brandColor || "#E1306C";

    const thumbnail = await generateThumbnail({
      productName: analysis.productName,
      brandColor,
      accentPhrase: preferences?.accentPhrase,
      style: "modern"
    });

    const script = generateScript({
      productName: analysis.productName,
      productPrice: analysis.productPrice,
      shortDescription: analysis.shortDescription,
      benefits: analysis.benefits,
      voiceMode: preferences?.voiceMode || "text"
    });

    let analysisRecordId: string | undefined;
    if (!skipPersistence && supabase && assetId) {
      const { data: analysisRecord, error: analysisError } = await supabase
        .from("product_analyses")
        .insert({
          user_id: userId,
          asset_id: assetId,
          model_name: "gemini-1.5-flash",
          product_name: analysis.productName,
          product_price: analysis.productPrice,
          currency: analysis.currency,
          short_description: analysis.shortDescription,
          benefits: analysis.benefits,
          attributes: analysis.attributes,
          confidence_score: analysis.confidenceScore,
          raw_response: {}
        })
        .select()
        .single();

      if (analysisError) {
        console.error("Erro ao salvar análise:", analysisError);
      } else {
        analysisRecordId = analysisRecord?.id;
      }
    }

    let reelId: string | undefined;
    if (!skipPersistence && supabase && assetId) {
      const { data: reel, error: reelError } = await supabase
        .from("reels")
        .insert({
          user_id: userId,
          title: `Reel - ${analysis.productName}`,
          status: "ready",
          asset_id: assetId,
          analysis_id: analysisRecordId,
          hook_text: script.hookText,
          caption: script.caption,
          hashtags: script.hashtags,
          narration_script: script.narration,
          duration_seconds: 15,
          voice_mode: preferences?.voiceMode || "text",
          thumbnail_storage_path: thumbnail.imageUrl
        })
        .select()
        .single();

      if (reelError) {
        console.error("Erro ao criar reel:", reelError);
        return NextResponse.json(
          { error: "Falha ao gerar reel" },
          { status: 500 }
        );
      }
      reelId = reel.id;
    }

    let videoUrl: string | undefined;
    try {
      const { renderReel } = await import("@/lib/video/render-reel");
      const videoBuffer = await renderReel({
        productImageUrl: imageUrl,
        thumbnailHeadline: analysis.productName,
        hookText: script.hookText,
        caption: script.caption,
        overlays: [
          { sequence: 1, text: script.hookText, animation: "fade-in", startMs: 0, endMs: 3000 },
          { sequence: 2, text: analysis.shortDescription, animation: "fade-in", startMs: 3000, endMs: 7000 },
          { sequence: 3, text: `R$ ${analysis.productPrice}`, animation: "fade-in", startMs: 7000, endMs: 12000 },
        ],
        durationSeconds: 15,
      });
      const videoBase64 = videoBuffer.toString("base64");
      videoUrl = `data:video/mp4;base64,${videoBase64}`;
    } catch (renderError) {
      console.warn("Renderização de vídeo não disponível, retornando sem vídeo:", renderError);
    }

    return NextResponse.json({
      success: true,
      reel: {
        id: reelId || `temp-${Date.now()}`,
        hookText: script.hookText,
        caption: script.caption,
        narration: script.narration,
        hashtags: script.hashtags,
        thumbnailUrl: thumbnail.imageUrl,
        videoUrl,
        analysis
      }
    });
  } catch (error) {
    console.error("Erro na geração:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
