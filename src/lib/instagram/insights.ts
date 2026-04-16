import { createServerSupabaseClient } from "@/lib/supabase/server";
import { graphRequest } from "@/lib/instagram/client";

interface GraphMetricItem {
  name: string;
  values?: Array<{ value?: number }>;
}

function readMetric(metrics: GraphMetricItem[], name: string): number {
  const item = metrics.find((entry) => entry.name === name);
  return Number(item?.values?.[0]?.value ?? 0);
}

export async function syncReelInsights(input: {
  tenantId: string;
  reelId: string;
}): Promise<{
  metricDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagementRate: number;
  estimatedCtr: number;
}> {
  const supabase = await createServerSupabaseClient();

  const { data: publication, error: publicationError } = await supabase
    .from("reel_publications")
    .select("id, instagram_media_id, instagram_connection_id")
    .eq("tenant_id", input.tenantId)
    .eq("reel_id", input.reelId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (publicationError || !publication?.instagram_media_id) {
    throw new Error(`Publicacao publicada nao encontrada: ${publicationError?.message ?? "sem media id"}`);
  }

  const { data: connection, error: connectionError } = await supabase
    .from("instagram_connections")
    .select("access_token")
    .eq("id", publication.instagram_connection_id)
    .eq("tenant_id", input.tenantId)
    .single();

  if (connectionError || !connection) {
    throw new Error(`Conexao Instagram nao encontrada: ${connectionError?.message ?? "erro desconhecido"}`);
  }

  const insights = await graphRequest<{ data: GraphMetricItem[] }>(`/${publication.instagram_media_id}/insights`, {
    method: "GET",
    accessToken: connection.access_token,
    params: {
      metric: "views,likes,comments,shares,saved,reach,total_interactions"
    }
  });

  const views = readMetric(insights.data, "views");
  const likes = readMetric(insights.data, "likes");
  const comments = readMetric(insights.data, "comments");
  const shares = readMetric(insights.data, "shares");
  const saves = readMetric(insights.data, "saved");
  const reach = readMetric(insights.data, "reach");
  const interactions = readMetric(insights.data, "total_interactions") || likes + comments + shares + saves;

  const engagementRate = reach > 0 ? Number(((interactions / reach) * 100).toFixed(3)) : 0;
  const estimatedCtr = views > 0 ? Number((((likes + comments) / views) * 100).toFixed(3)) : 0;

  const metricDate = new Date().toISOString().slice(0, 10);

  const { error: upsertError } = await supabase.from("reel_metrics_daily").upsert(
    {
      tenant_id: input.tenantId,
      reel_id: input.reelId,
      publication_id: publication.id,
      metric_date: metricDate,
      views,
      likes,
      comments,
      shares,
      saves,
      reach,
      interactions,
      estimated_ctr: estimatedCtr,
      engagement_rate: engagementRate,
      raw_insights: insights
    },
    { onConflict: "reel_id,metric_date" }
  );

  if (upsertError) {
    throw new Error(`Falha ao salvar metricas: ${upsertError.message}`);
  }

  return {
    metricDate,
    views,
    likes,
    comments,
    shares,
    saves,
    reach,
    engagementRate,
    estimatedCtr
  };
}
