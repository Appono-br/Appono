import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type ProfileType = "cliente" | "restaurante";

export type AuthResponse = {
  tipo?: ProfileType;
  perfil?: {
    nome?: string;
    email?: string;
  };
  session?: Session | null;
  message?: string;
};

export function getDashboardPath(tipo?: ProfileType) {
  return tipo === "restaurante" ? "/restaurante/dashboard" : "/dashboard";
}

export async function persistAuthResponse(response: AuthResponse) {
  if (response.session) {
    await supabase.auth.setSession({
      access_token: response.session.access_token,
      refresh_token: response.session.refresh_token,
    });
  }

  if (response.tipo && response.perfil) {
    const sessionType = response.tipo === "restaurante" ? "restaurant" : "client";

    localStorage.setItem(
      "appono:session",
      JSON.stringify({
        type: sessionType,
        name: response.perfil.nome,
      }),
    );
  }
}
