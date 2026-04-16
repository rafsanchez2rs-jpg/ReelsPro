import { BillingPlans } from "@/components/dashboard/billing-plans";
import { getBillingOverviewAction } from "@/actions/billing.actions";

export default async function SettingsPage() {
  const overview = await getBillingOverviewAction();

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">Planos e Assinatura</h2>
        <p className="mt-1 text-sm text-slate-600">Gerencie upgrade, cobrança recorrente e limites do seu tenant.</p>
      </header>

      <BillingPlans
        currentPlan={overview.planTier}
        status={overview.status}
        reelsGeneratedThisMonth={overview.reelsGeneratedThisMonth}
        maxReelsPerMonth={overview.maxReelsPerMonth}
      />
    </section>
  );
}
