"use client";

import { Card } from "@/components/ui/card";

interface KpiCardsProps {
  values: {
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
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

export function KpiCards({ values }: KpiCardsProps) {
  const items = [
    { label: "Views", value: formatInt(values.totalViews) },
    { label: "Alcance", value: formatInt(values.totalReach) },
    { label: "Likes", value: formatInt(values.totalLikes) },
    { label: "Comentarios", value: formatInt(values.totalComments) },
    { label: "Shares", value: formatInt(values.totalShares) },
    { label: "Salvos", value: formatInt(values.totalSaves) },
    { label: "Engajamento medio", value: formatPercent(values.avgEngagementRate) },
    { label: "CTR estimado", value: formatPercent(values.avgEstimatedCtr) },
    { label: "Reels publicados", value: formatInt(values.reelsPublished) }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
