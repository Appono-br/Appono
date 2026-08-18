"use client";

import { useEffect } from "react";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { clearAuthResponse, getAccessToken } from "@/lib/session";

const destinoPorPerfil = {
  client: "/cliente/dashboard",
  restaurant: "/restaurante/home",
  admin: "/admin/financeiro",
};

function obterUrlLogin() {
  const destinoAtual = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(destinoAtual)}`;
}

export function RotaProtegida({ children, perfisPermitidos }) {
  const { sessao, sessaoCarregada } = useSessaoLocal();
  const tipoPermitido = sessao ? perfisPermitidos.includes(sessao.type) : false;

  useEffect(() => {
    if (!sessaoCarregada) {
      return;
    }

    const token = getAccessToken();

    if (!sessao || !token) {
      clearAuthResponse();
      window.location.replace(obterUrlLogin());
      return;
    }

    if (!tipoPermitido) {
      window.location.replace(destinoPorPerfil[sessao.type] ?? "/login");
    }
  }, [sessao, sessaoCarregada, tipoPermitido]);

  if (!sessaoCarregada || !sessao || !tipoPermitido || !getAccessToken()) {
    return <TelaCarregandoSessao />;
  }

  return children;
}
