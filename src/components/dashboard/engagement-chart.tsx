"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/components/ui/card";

interface EngagementChartProps {
  data: Array<{
    metricDate: string;
    views: number;
    reach: number;
    engagementRate: number;
    estimatedCtr: number;
  }>;
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-slate-900">Desempenho dos ultimos 30 dias</p>
      <p className="mb-3 mt-1 text-xs text-slate-500">Views, alcance, engajamento e CTR estimado.</p>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metricDate" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name="Views" />
            <Line yAxisId="left" type="monotone" dataKey="reach" stroke="#0f766e" strokeWidth={2} dot={false} name="Alcance" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="engagementRate"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              name="Engajamento %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="estimatedCtr"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              name="CTR %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
