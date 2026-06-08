import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (
  process.env.NODE_ENV !== "production" &&
  process.env.SUPABASE_ALLOW_INSECURE_TLS === "true"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

const missingSupabaseConfigMessage =
  "O acesso esta temporariamente indisponivel. Tente novamente mais tarde.";

function hasSupabasePlaceholder(value?: string) {
  return (
    !value ||
    value.includes("seu-projeto") ||
    value.includes("sua-chave") ||
    value.includes("sua-chave-secreta")
  );
}

function createUnavailableSupabaseClient(): ReturnType<typeof createClient> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(missingSupabaseConfigMessage);
      },
    },
  ) as ReturnType<typeof createClient>;
}

export function isSupabaseConfigured() {
  return !hasSupabasePlaceholder(supabaseUrl) && !hasSupabasePlaceholder(publishableKey);
}

export const supabaseAuth =
  isSupabaseConfigured()
    ? createClient(supabaseUrl!, publishableKey!)
    : createUnavailableSupabaseClient();

export const supabaseAdmin = isSupabaseConfigured() && !hasSupabasePlaceholder(secretKey)
  ? createClient(supabaseUrl!, secretKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function createUserSupabaseClient(accessToken: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(missingSupabaseConfigMessage);
  }

  return createClient(supabaseUrl!, publishableKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
