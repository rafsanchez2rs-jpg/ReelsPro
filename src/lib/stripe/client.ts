import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY nao configurada");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
