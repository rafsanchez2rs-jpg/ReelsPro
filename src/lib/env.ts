import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000")
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  GROQ_API_KEY: z.string().min(10).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(10).optional(),
  ELEVENLABS_API_KEY: z.string().min(10).optional(),
  FLUX_API_KEY: z.string().min(10).optional(),
  SHOTSTACK_API_KEY: z.string().min(10).optional(),
  META_GRAPH_API_VERSION: z.string().default("v22.0"),
  META_GRAPH_BASE_URL: z.string().url().default("https://graph.facebook.com")
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
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  FLUX_API_KEY: process.env.FLUX_API_KEY,
  SHOTSTACK_API_KEY: process.env.SHOTSTACK_API_KEY,
  META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION,
  META_GRAPH_BASE_URL: process.env.META_GRAPH_BASE_URL
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;