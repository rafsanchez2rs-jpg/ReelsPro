import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

    const supabase = await createServerSupabaseClient();

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

    const { data: analysisRecord, error: analysisError } = await supabase
      .from("product_analyses")
      .insert({
        user_id: userId,
        asset_id: asset.id,
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
    }

    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .insert({
        user_id: userId,
        title: `Reel - ${analysis.productName}`,
        status: "ready",
        asset_id: asset.id,
        analysis_id: analysisRecord?.id,
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

    return NextResponse.json({
      success: true,
      reel: {
        id: reel.id,
        hookText: script.hookText,
        caption: script.caption,
        narration: script.narration,
        hashtags: script.hashtags,
        thumbnailUrl: thumbnail.imageUrl,
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