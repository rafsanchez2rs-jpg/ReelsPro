import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url()
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  META_GRAPH_API_VERSION: z.string().default("v22.0"),
  META_GRAPH_BASE_URL: z.string().url().default("https://graph.facebook.com"),
  ELEVENLABS_API_KEY: z.string().min(10).optional(),
  CARTESIA_API_KEY: z.string().min(10).optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(10).optional(),
  STRIPE_PRICE_FREE: z.string().min(3).optional(),
  STRIPE_PRICE_PRO: z.string().min(3).optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().min(3).optional()
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
  META_GRAPH_BASE_URL: process.env.META_GRAPH_BASE_URL,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  CARTESIA_API_KEY: process.env.CARTESIA_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_FREE: process.env.STRIPE_PRICE_FREE,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE
});
