import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "./env";

export function createSupabaseClient() {
  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}