import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY precisam estar configuradas.");
}

const requiredSupabaseUrl = supabaseUrl;
const requiredPublishableKey = publishableKey;

export const supabaseAuth = createClient(
  requiredSupabaseUrl,
  requiredPublishableKey,
);

export const supabaseAdmin = secretKey
  ? createClient(requiredSupabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function createUserSupabaseClient(accessToken: string) {
  return createClient(requiredSupabaseUrl, requiredPublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
