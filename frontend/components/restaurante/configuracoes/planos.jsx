"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useInterface } from "@/lib/use-interface";

const moeda = (valor, locale) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));

export default function Planos() {
  const { ui, localeUI } = useInterface();
  const [dados, setDados] = useState(null);
  const [mensagem, setMensagem] = useState("Carregando planos...");
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await apiRequest("/planos/assinatura", { forceRefresh: true });
      setDados(resposta);
      setMensagem(resposta.sincronizacao_pendente
        ? "Não foi possível confirmar seu plano agora. Tentaremos novamente automaticamente."
        : "");
      return resposta;
    } catch (error) {
      setMensagem(error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let encerrado = false;
    let emAndamento = false;
    let timer;
    const verificarPlano = async () => {
      if (encerrado || emAndamento) return;
      clearTimeout(timer);
      emAndamento = true;
      let resposta;
      try {
        if (document.visibilityState === "visible") resposta = await carregar();
      } finally {
        emAndamento = false;
        if (!encerrado) {
          timer = setTimeout(verificarPlano,
            resposta?.assinatura?.status === "PENDENTE_PAGAMENTO" ? 5000 : 30000);
        }
      }
    };
    verificarPlano();
    window.addEventListener("focus", verificarPlano);
    return () => {
      encerrado = true;
      clearTimeout(timer);
      window.removeEventListener("focus", verificarPlano);
    };
  }, [carregar]);

  async function contratar() {
    setCarregando(true);
    setMensagem("");
    try {
      const resposta = await apiRequest("/planos/checkout", {
        method: "POST",
        body: JSON.stringify({ plano: "PROFISSIONAL" }),
      });
      window.location.assign(resposta.checkout_url);
    } catch (error) {
      setMensagem(error.message);
      setCarregando(false);
    }
  }

  async function cancelar() {
    setCarregando(true);
    setMensagem("");
    try {
      const resposta = await apiRequest("/planos/cancelar-renovacao", { method: "POST" });
      await carregar();
      setMensagem(resposta.message);
    } catch (error) {
      setMensagem(error.message);
    } finally {
      setCarregando(false);
    }
  }

  const assinatura = dados?.assinatura;
  const profissional = assinatura?.codigo_plano === "PROFISSIONAL" && assinatura?.status === "ATIVA";
  const aguardandoPagamentoProfissional = assinatura?.codigo_plano === "PROFISSIONAL" && assinatura?.status !== "ATIVA";

  return (
    <section className="planos-restaurante" aria-labelledby="titulo-planos-restaurante">
      <h2 id="titulo-planos-restaurante" className="text-3xl font-medium text-app-cafe-profundo">
        {ui("Planos")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-app-cinza">
        {ui("Escolha o plano que melhor atende ao seu restaurante.")}
      </p>

      {mensagem ? (
        <p role="status" className="mt-6 rounded-lg bg-app-creme-leve p-4 text-sm text-app-mocha">
          {ui(mensagem)}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {(dados?.planos ?? []).map((plano) => {
          const ativo = plano.codigo === "INICIAL"
            ? assinatura?.codigo_plano === "INICIAL" && assinatura?.status === "ATIVA"
            : profissional;
          const selecionadoPendente = plano.codigo === "PROFISSIONAL" && aguardandoPagamentoProfissional;

          return (
            <article key={plano.codigo} className={`min-w-0 rounded-xl border p-5 ${ativo
              ? "border-app-caramelo-torrado bg-app-creme-leve"
              : "border-app-baunilha-dourada bg-app-creme-suave"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold">{ui(plano.nome)}</h3>
                {ativo ? (
                  <span className="rounded-full bg-app-caramelo-torrado px-3 py-1 text-xs font-bold text-white">
                    {ui("Plano atual")}
                  </span>
                ) : selecionadoPendente ? (
                  <span className="rounded-full bg-app-dourado-mel/10 px-3 py-1 text-xs font-bold text-app-caramelo-torrado">
                    {ui("Pagamento pendente")}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-app-cinza">
                {plano.mensalidade ? `${moeda(plano.mensalidade, localeUI)}/${ui("mês")}` : ui("Sem mensalidade")}
              </p>
              <p className="mt-1 text-sm leading-6 text-app-cinza">
                {plano.percentual_comissao}% {ui("de comissão por prato vendido.")}
              </p>
              <ul className="mt-6 grid gap-3 text-sm leading-6 text-app-mocha">
                <li>✓ {ui("Cardápio, reservas, pedidos e desempenho")}</li>
                <li>✓ {ui(plano.destaque_profissional
                  ? "Destaque Profissional em áreas relevantes"
                  : "Presença orgânica na Appono")}</li>
                <li>✓ {ui(plano.campanhas_inteligentes
                  ? "Campanhas Inteligentes e métricas de conversão"
                  : "Sem campanhas promocionais")}</li>
              </ul>
              {plano.codigo === "PROFISSIONAL" && !profissional ? (
                <button type="button" disabled={carregando} onClick={contratar}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-app-dourado-mel px-5 py-3 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado disabled:opacity-60">
                  {ui(carregando ? "Preparando checkout..." : selecionadoPendente
                    ? "Continuar para o Mercado Pago" : "Assinar Profissional")}
                </button>
              ) : null}
              {plano.codigo === "PROFISSIONAL" && profissional ? (
                assinatura.cancelar_no_fim_do_periodo ? (
                  <p className="mt-6 text-sm font-semibold text-app-cinza">{ui("Renovação cancelada")}</p>
                ) : (
                  <button type="button" disabled={carregando} onClick={cancelar}
                    className="mt-6 rounded-lg border border-app-baunilha-dourada px-4 py-3 text-sm font-semibold text-app-mocha transition hover:bg-app-chantilly disabled:opacity-60">
                    {ui("Cancelar renovação")}
                  </button>
                )
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
