"use client";

import { useEffect, useState } from "react";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { apiRequest } from "@/lib/api";
import { clearAuthResponse, getAccessToken, persistAuthResponse } from "@/lib/session";

const tipoSessaoPorPerfil = {
  cliente: "client",
  restaurante: "restaurant",
  admin: "admin",
};

function obterUrlLogin(motivo = "acesso") {
  const destinoAtual = `${window.location.pathname}${window.location.search}`;
  return `/login?motivo=${motivo}&redirect=${encodeURIComponent(destinoAtual)}`;
}

export function RotaProtegida({ children, perfisPermitidos }) {
  const { sessao, sessaoCarregada } = useSessaoLocal();
  const [acessoValidado, setAcessoValidado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function validarAcesso() {
      setAcessoValidado(false);

      const token = getAccessToken();

      if (!sessao || !token) {
        clearAuthResponse();
        window.location.replace(obterUrlLogin("sessao"));
        return;
      }

      try {
        const perfilAtual = await apiRequest("/me", {
          cacheTtlMs: 0,
          forceRefresh: true,
        });
        const tipoSessao = tipoSessaoPorPerfil[perfilAtual.tipo];

        if (!tipoSessao || !perfisPermitidos.includes(tipoSessao)) {
          clearAuthResponse();
          window.location.replace(obterUrlLogin("perfil"));
          return;
        }

        await persistAuthResponse(perfilAtual);

        if (!cancelado) {
          setAcessoValidado(true);
        }
      } catch {
        clearAuthResponse();
        window.location.replace(obterUrlLogin("token"));
      }
    }

    if (!sessaoCarregada) {
      return undefined;
    }

    validarAcesso();

    return () => {
      cancelado = true;
    };
  }, [sessao, sessaoCarregada, perfisPermitidos]);

  if (!sessaoCarregada || !acessoValidado) {
    return <TelaCarregandoSessao />;
  }

  return children;
}
