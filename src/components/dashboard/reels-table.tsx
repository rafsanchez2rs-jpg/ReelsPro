"use client";

import { Card } from "@/components/ui/card";

interface ReelsTableRow {
  reelId: string;
  title: string;
  status: string;
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

interface ReelsTableProps {
  rows: ReelsTableRow[];
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

export function ReelsTable({ rows }: ReelsTableProps) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Reel</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Views</th>
            <th className="px-4 py-3">Likes</th>
            <th className="px-4 py-3">Comentarios</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">Alcance</th>
            <th className="px-4 py-3">Engajamento</th>
            <th className="px-4 py-3">CTR</th>
            <th className="px-4 py-3">Link</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.reelId} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
              <td className="px-4 py-3 text-slate-700">{row.status}</td>
              <td className="px-4 py-3 text-slate-700">{formatInt(row.views)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInt(row.likes)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInt(row.comments)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInt(row.shares)}</td>
              <td className="px-4 py-3 text-slate-700">{formatInt(row.reach)}</td>
              <td className="px-4 py-3 text-slate-700">{row.engagementRate.toFixed(2).replace(".", ",")}%</td>
              <td className="px-4 py-3 text-slate-700">{row.estimatedCtr.toFixed(2).replace(".", ",")}%</td>
              <td className="px-4 py-3">
                {row.permalink ? (
                  <a href={row.permalink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                    Abrir
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
