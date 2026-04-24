import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceRoleKey
  ? createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;