import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type ProfileType = "cliente" | "restaurante";
const authTokensKey = "appono:auth";
export type AuthTokens = {
  accessToken?: string;
  refreshToken?: string;
};

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
  return tipo === "restaurante" ? "/restaurante/dashboard" : "/cliente/dashboard";
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
    const tokens = JSON.parse(storedTokens) as AuthTokens;
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

export function obterTokensAutenticacao() {
  if (typeof window === "undefined") {
    return null;
  }

  const tokensArmazenados = window.localStorage.getItem(authTokensKey);

  if (!tokensArmazenados) {
    return null;
  }

  try {
    return JSON.parse(tokensArmazenados) as AuthTokens;
  } catch {
    return null;
  }
}

export function atualizarNomeSessao(nome?: string) {
  if (typeof window === "undefined" || !nome) {
    return;
  }

  const sessaoArmazenada = window.localStorage.getItem("appono:session");

  if (!sessaoArmazenada) {
    return;
  }

  try {
    const sessao = JSON.parse(sessaoArmazenada) as { type?: string; name?: string };
    window.localStorage.setItem(
      "appono:session",
      JSON.stringify({ ...sessao, name: nome }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "appono:session" }));
  } catch {
    window.localStorage.removeItem("appono:session");
  }
}

export async function encerrarSessao() {
  try {
    const storedTokens = window.localStorage.getItem(authTokensKey);
    const tokens = storedTokens ? (JSON.parse(storedTokens) as AuthTokens) : null;

    if (tokens?.accessToken && tokens.refreshToken) {
      await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    }

    await supabase.auth.signOut({ scope: "local" });
  } catch {
    return clearAuthResponse();
  }

  clearAuthResponse();
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
