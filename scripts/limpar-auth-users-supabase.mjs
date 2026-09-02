import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../backend/.env");

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match || process.env[match[1]]) continue;
  process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secretKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar configuradas em backend/.env.");
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let removidos = 0;
let rodada = 0;

while (rodada < 20) {
  rodada += 1;

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw error;

  const users = data?.users ?? [];
  if (users.length === 0) break;

  for (const user of users) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new Error(`Falha ao remover usuario Auth ${user.id}: ${deleteError.message}`);
    }

    removidos += 1;
  }
}

console.log(`Usuarios Auth removidos: ${removidos}`);
