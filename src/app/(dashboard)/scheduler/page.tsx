import { SchedulerTable } from "@/components/dashboard/scheduler-table";
import { getCurrentTenantContext } from "@/lib/auth/permissions";
import { getSchedulerRows } from "@/lib/dashboard/metrics";

export default async function SchedulerPage() {
  const { tenantId } = await getCurrentTenantContext();
  const rows = await getSchedulerRows(tenantId);

  const counts = {
    scheduled: rows.filter((item) => item.status === "scheduled").length,
    published: rows.filter((item) => item.status === "published").length,
    failed: rows.filter((item) => item.status === "failed").length
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">Scheduler de Publicacoes</h2>
        <p className="mt-1 text-sm text-slate-600">Monitore fila de agendamentos e status das publicacoes Instagram.</p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Agendadas: {counts.scheduled}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Publicadas: {counts.published}</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">Falhas: {counts.failed}</span>
        </div>
      </header>

      <SchedulerTable rows={rows} />
    </section>
  );
}
