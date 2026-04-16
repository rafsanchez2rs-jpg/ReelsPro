import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { ReelsTable } from "@/components/dashboard/reels-table";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { getDashboardOverview } from "@/lib/dashboard/metrics";

export default async function MetricsPage() {
  const { tenantId } = await getCurrentTenantContext();
  const overview = await getDashboardOverview(tenantId);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard de Metricas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Consolidado real de views, engajamento, alcance, CTR e performance por Reel.
        </p>
      </header>

      <KpiCards values={overview.kpis} />

      <EngagementChart data={overview.chartSeries} />

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900">Ranking de Reels</h3>
        <ReelsTable rows={overview.reelRows} />
      </div>
    </section>
  );
}
