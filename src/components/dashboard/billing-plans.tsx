"use client";

import { useActionState, useEffect } from "react";
import {
  BILLING_INITIAL_STATE,
  openBillingPortalAction,
  startUpgradeCheckoutAction,
  type BillingActionState
} from "@/actions/billing.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BillingPlansProps {
  currentPlan: "free" | "pro" | "enterprise";
  status: string;
  reelsGeneratedThisMonth: number;
  maxReelsPerMonth: number;
}

const PLAN_LIST = [
  {
    tier: "free",
    title: "Free",
    price: "R$ 0",
    subtitle: "Ideal para validar operacao",
    features: ["10 reels/mes", "1 usuario", "Sem agendamento avancado"]
  },
  {
    tier: "pro",
    title: "Pro",
    price: "R$ 97/mes",
    subtitle: "Para escala comercial",
    features: ["300 reels/mes", "Agendamento", "Metricas avancadas", "Editor completo"]
  },
  {
    tier: "enterprise",
    title: "Enterprise",
    price: "Sob consulta",
    subtitle: "Operacao multi-time",
    features: ["5000 reels/mes", "Times grandes", "Suporte prioritario", "White-label readiness"]
  }
] as const;

export function BillingPlans(props: BillingPlansProps) {
  const [checkoutState, checkoutAction, checkoutPending] = useActionState<BillingActionState, FormData>(
    startUpgradeCheckoutAction,
    BILLING_INITIAL_STATE
  );
  const [portalState, portalAction, portalPending] = useActionState<BillingActionState, FormData>(
    openBillingPortalAction,
    BILLING_INITIAL_STATE
  );

  useEffect(() => {
    if (checkoutState.checkoutUrl) {
      window.location.href = checkoutState.checkoutUrl;
    }
  }, [checkoutState.checkoutUrl]);

  useEffect(() => {
    if (portalState.portalUrl) {
      window.location.href = portalState.portalUrl;
    }
  }, [portalState.portalUrl]);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-slate-900">Plano atual: {props.currentPlan.toUpperCase()}</h2>
        <p className="mt-1 text-sm text-slate-600">Status Stripe: {props.status}</p>
        <p className="mt-1 text-sm text-slate-700">
          Uso mensal: <strong>{props.reelsGeneratedThisMonth}</strong> / {props.maxReelsPerMonth} reels
        </p>

        <form action={portalAction} className="mt-4">
          <Button type="submit" variant="outline" disabled={portalPending}>
            {portalPending ? "Abrindo..." : "Abrir portal de faturamento"}
          </Button>
        </form>

        {portalState.message ? (
          <p className={`mt-2 text-xs ${portalState.success ? "text-emerald-700" : "text-red-600"}`}>{portalState.message}</p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const isCurrent = plan.tier === props.currentPlan;
          const isPaid = plan.tier !== "free";

          return (
            <Card key={plan.tier} className={`p-5 ${isCurrent ? "border-blue-300 ring-2 ring-blue-100" : ""}`}>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{plan.title}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</p>
              <p className="mt-1 text-sm text-slate-600">{plan.subtitle}</p>

              <ul className="mt-4 space-y-1 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <Button type="button" disabled>
                    Plano atual
                  </Button>
                ) : isPaid ? (
                  <form action={checkoutAction}>
                    <input type="hidden" name="planTier" value={plan.tier} />
                    <Button type="submit" disabled={checkoutPending}>
                      {checkoutPending ? "Carregando..." : "Fazer upgrade"}
                    </Button>
                  </form>
                ) : (
                  <Button type="button" disabled>
                    Incluido
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {checkoutState.message ? (
        <p className={`text-xs ${checkoutState.success ? "text-emerald-700" : "text-red-600"}`}>{checkoutState.message}</p>
      ) : null}
    </div>
  );
}
