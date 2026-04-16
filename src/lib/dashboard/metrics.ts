import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface MetricsPoint {
  metricDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagementRate: number;
  estimatedCtr: number;
}

export interface ReelPerformanceRow {
  reelId: string;
  title: string;
  status: string;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagementRate: number;
  estimatedCtr: number;
  permalink?: string | null;
}

export interface DashboardOverview {
  kpis: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
    avgEngagementRate: number;
    avgEstimatedCtr: number;
    reelsPublished: number;
  };
  chartSeries: MetricsPoint[];
  reelRows: ReelPerformanceRow[];
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function getDashboardOverview(tenantId: string): Promise<DashboardOverview> {
  const supabase = await createServerSupabaseClient();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  const sinceIsoDate = sinceDate.toISOString().slice(0, 10);

  const { data: dailyMetrics, error: metricsError } = await supabase
    .from("reel_metrics_daily")
    .select(
      "reel_id,metric_date,views,likes,comments,shares,saves,reach,engagement_rate,estimated_ctr"
    )
    .eq("tenant_id", tenantId)
    .gte("metric_date", sinceIsoDate)
    .order("metric_date", { ascending: true });

  if (metricsError) {
    throw new Error(`Falha ao carregar metricas: ${metricsError.message}`);
  }

  const { data: reels, error: reelsError } = await supabase
    .from("reels")
    .select("id,title,status,published_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (reelsError) {
    throw new Error(`Falha ao carregar reels: ${reelsError.message}`);
  }

  const { data: publications, error: publicationsError } = await supabase
    .from("reel_publications")
    .select("reel_id,instagram_permalink,status,published_at")
    .eq("tenant_id", tenantId);

  if (publicationsError) {
    throw new Error(`Falha ao carregar publicacoes: ${publicationsError.message}`);
  }

  const chartMap = new Map<string, MetricsPoint>();
  const reelAggMap = new Map<string, Omit<ReelPerformanceRow, "reelId" | "title" | "status" | "publishedAt" | "permalink">>();

  for (const row of dailyMetrics ?? []) {
    const metricDate = String(row.metric_date);
    const current = chartMap.get(metricDate) ?? {
      metricDate,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      engagementRate: 0,
      estimatedCtr: 0
    };

    current.views += asNumber(row.views);
    current.likes += asNumber(row.likes);
    current.comments += asNumber(row.comments);
    current.shares += asNumber(row.shares);
    current.saves += asNumber(row.saves);
    current.reach += asNumber(row.reach);
    current.engagementRate += asNumber(row.engagement_rate);
    current.estimatedCtr += asNumber(row.estimated_ctr);

    chartMap.set(metricDate, current);

    const reelId = String(row.reel_id);
    const currentReel = reelAggMap.get(reelId) ?? {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      engagementRate: 0,
      estimatedCtr: 0
    };

    currentReel.views += asNumber(row.views);
    currentReel.likes += asNumber(row.likes);
    currentReel.comments += asNumber(row.comments);
    currentReel.shares += asNumber(row.shares);
    currentReel.saves += asNumber(row.saves);
    currentReel.reach += asNumber(row.reach);
    currentReel.engagementRate += asNumber(row.engagement_rate);
    currentReel.estimatedCtr += asNumber(row.estimated_ctr);

    reelAggMap.set(reelId, currentReel);
  }

  const chartSeries = [...chartMap.values()].map((point) => {
    const divider = (dailyMetrics ?? []).filter((metric) => String(metric.metric_date) === point.metricDate).length || 1;
    return {
      ...point,
      engagementRate: Number((point.engagementRate / divider).toFixed(3)),
      estimatedCtr: Number((point.estimatedCtr / divider).toFixed(3))
    };
  });

  const publicationMap = new Map<string, { permalink?: string | null; publishedAt?: string | null }>();

  for (const publication of publications ?? []) {
    const reelId = String(publication.reel_id);
    const existing = publicationMap.get(reelId);

    if (!existing || String(publication.published_at ?? "") > String(existing.publishedAt ?? "")) {
      publicationMap.set(reelId, {
        permalink: publication.instagram_permalink,
        publishedAt: publication.published_at
      });
    }
  }

  const reelRows: ReelPerformanceRow[] = (reels ?? []).map((reel) => {
    const agg = reelAggMap.get(String(reel.id)) ?? {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      engagementRate: 0,
      estimatedCtr: 0
    };

    const publication = publicationMap.get(String(reel.id));

    return {
      reelId: String(reel.id),
      title: String(reel.title),
      status: String(reel.status),
      publishedAt: reel.published_at,
      views: agg.views,
      likes: agg.likes,
      comments: agg.comments,
      shares: agg.shares,
      saves: agg.saves,
      reach: agg.reach,
      engagementRate: Number(agg.engagementRate.toFixed(3)),
      estimatedCtr: Number(agg.estimatedCtr.toFixed(3)),
      permalink: publication?.permalink ?? null
    };
  });

  const totals = reelRows.reduce(
    (acc, row) => {
      acc.totalViews += row.views;
      acc.totalLikes += row.likes;
      acc.totalComments += row.comments;
      acc.totalShares += row.shares;
      acc.totalSaves += row.saves;
      acc.totalReach += row.reach;
      acc.totalEngagementRate += row.engagementRate;
      acc.totalCtr += row.estimatedCtr;
      return acc;
    },
    {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalReach: 0,
      totalEngagementRate: 0,
      totalCtr: 0
    }
  );

  const reelCount = reelRows.length || 1;

  return {
    kpis: {
      totalViews: totals.totalViews,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalShares: totals.totalShares,
      totalSaves: totals.totalSaves,
      totalReach: totals.totalReach,
      avgEngagementRate: Number((totals.totalEngagementRate / reelCount).toFixed(3)),
      avgEstimatedCtr: Number((totals.totalCtr / reelCount).toFixed(3)),
      reelsPublished: reelRows.filter((row) => row.status === "published").length
    },
    chartSeries,
    reelRows: reelRows.sort((a, b) => b.views - a.views)
  };
}

export interface ScheduledPublicationRow {
  publicationId: string;
  reelId: string;
  reelTitle: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  permalink: string | null;
}

export async function getSchedulerRows(tenantId: string): Promise<ScheduledPublicationRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data: publications, error } = await supabase
    .from("reel_publications")
    .select("id,reel_id,status,scheduled_for,published_at,instagram_permalink")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Falha ao carregar scheduler: ${error.message}`);
  }

  const reelIds = [...new Set((publications ?? []).map((item) => String(item.reel_id)))];

  let reelsMap = new Map<string, string>();

  if (reelIds.length > 0) {
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select("id,title")
      .in("id", reelIds);

    if (reelsError) {
      throw new Error(`Falha ao carregar titulos dos reels: ${reelsError.message}`);
    }

    reelsMap = new Map((reels ?? []).map((reel) => [String(reel.id), String(reel.title)]));
  }

  return (publications ?? []).map((publication) => ({
    publicationId: String(publication.id),
    reelId: String(publication.reel_id),
    reelTitle: reelsMap.get(String(publication.reel_id)) ?? "Reel sem titulo",
    status: String(publication.status),
    scheduledFor: publication.scheduled_for,
    publishedAt: publication.published_at,
    permalink: publication.instagram_permalink
  }));
}
