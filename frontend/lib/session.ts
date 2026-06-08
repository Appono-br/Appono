import type { Session } from "@supabase/supabase-js";

type ProfileType = "cliente" | "restaurante";
const authTokensKey = "appono:auth";

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

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTokens = window.localStorage.getItem(authTokensKey);

  if (!storedTokens) {
    return null;
  }

  try {
    const tokens = JSON.parse(storedTokens) as { accessToken?: string };
    return tokens.accessToken ?? null;
  } catch {
    window.localStorage.removeItem(authTokensKey);
    return null;
  }
}

export function clearAuthResponse() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authTokensKey);
  window.localStorage.removeItem("appono:session");
}

export async function persistAuthResponse(response: AuthResponse) {
  if (response.session) {
    localStorage.setItem(
      authTokensKey,
      JSON.stringify({
        accessToken: response.session.access_token,
        refreshToken: response.session.refresh_token,
      }),
    );
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
