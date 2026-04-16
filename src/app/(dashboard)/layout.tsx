import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/onboarding", label: "Onboarding" },
  { href: "/upload", label: "Gerador" },
  { href: "/metrics", label: "Metricas" },
  { href: "/scheduler", label: "Scheduler" },
  { href: "/settings", label: "Assinatura" }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-transparent p-6 md:p-8">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ReelShopee Pro</p>
            <h1 className="text-lg font-semibold text-slate-900">Painel Operacional</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}
