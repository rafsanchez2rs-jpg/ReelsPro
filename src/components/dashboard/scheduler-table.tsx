"use client";

import { Card } from "@/components/ui/card";

interface SchedulerRow {
  publicationId: string;
  reelId: string;
  reelTitle: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  permalink: string | null;
}

interface SchedulerTableProps {
  rows: SchedulerRow[];
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function SchedulerTable({ rows }: SchedulerTableProps) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Reel</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Agendado para</th>
            <th className="px-4 py-3">Publicado em</th>
            <th className="px-4 py-3">Post</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.publicationId} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">{row.reelTitle}</td>
              <td className="px-4 py-3 text-slate-700">{row.status}</td>
              <td className="px-4 py-3 text-slate-700">{formatDateTime(row.scheduledFor)}</td>
              <td className="px-4 py-3 text-slate-700">{formatDateTime(row.publishedAt)}</td>
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
