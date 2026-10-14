"use client";

import { useInterface } from "@/lib/use-interface";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const textos = { NAO_CONECTADO: "Não conectado", AGUARDANDO_AUTORIZACAO: "Conexão pendente", CONECTADO: "Conectado", EXPIRADO: "Conexão expirada", ERRO: "Erro na conexão", DESCONECTADO: "Desconectado" };

export default function MercadoPagoSettingsPage() {
  const { ui, localeUI } = useInterface();
  const [conexao, setConexao] = useState(null); const [mensagem, setMensagem] = useState("Carregando conexão..."); const [acao, setAcao] = useState(false); const [confirmar, setConfirmar] = useState(false);
  useEffect(() => { apiRequest("/marketplace/mercado-pago/status", { forceRefresh: true }).then((r) => { setConexao(r.conexao); setMensagem(""); }).catch(() => setMensagem("Não foi possível consultar a conexão agora.")); }, []);
  async function conectar() { setAcao(true); setMensagem(""); try { const r = await apiRequest("/marketplace/mercado-pago/conectar", { method: "POST" }); if (!r.authorization_url) throw new Error(); window.location.assign(r.authorization_url); } catch { setMensagem("Não foi possível abrir a autorização do Mercado Pago. Tente novamente."); setAcao(false); } }
  async function desconectar() { setAcao(true); try { const r = await apiRequest("/marketplace/mercado-pago/desconectar", { method: "POST" }); setConexao(r.conexao); setMensagem("Conta desconectada."); setConfirmar(false); } catch { setMensagem("Não foi possível desconectar a conta agora."); } finally { setAcao(false); } }
  const conectado = conexao?.status === "CONECTADO";
  return <div className="min-w-0 text-app-cafe-profundo"><section className="mx-auto max-w-4xl">
    <div className="mt-6 rounded-2xl bg-app-creme-leve p-7 ring-1 ring-app-baunilha-dourada/60"><h2 className="text-3xl font-semibold">{ui("Conexão com Mercado Pago")}</h2></div>
    <section className="mt-6 rounded-2xl border border-app-baunilha-dourada p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm text-app-cinza">{ui("Estado atual")}</p><p className="mt-1 text-2xl font-semibold">{ui(textos[conexao?.status] ?? textos.NAO_CONECTADO)}</p>{conexao?.mercado_pago_user_id ? <p className="mt-2 text-sm text-app-mocha">{ui("Conta ")}{conexao.mercado_pago_user_id}</p> : null}<p className="mt-2 text-sm text-app-cinza">{ui("Ambiente: ")}{conexao?.live_mode ? ui("produção") : ui("teste")}</p>{conexao?.atualizado_em ? <p className="mt-1 text-sm text-app-cinza">{ui("Última verificação: ")}{new Date(conexao.atualizado_em).toLocaleString(localeUI)}</p> : null}</div>
      {conectado ? <button type="button" disabled={acao} onClick={() => setConfirmar(true)} className="rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-700">{ui("Desconectar")}</button> : <button type="button" disabled={acao} onClick={conectar} className="rounded-full bg-app-cafe-profundo px-5 py-3 text-sm font-semibold text-white">{acao ? ui("Abrindo autorização...") : conexao?.status === "EXPIRADO" || conexao?.status === "ERRO" ? "Reconectar" : "Conectar Mercado Pago"}</button>}
    </div>{mensagem ? <p role="status" className="mt-5 text-sm text-app-caramelo-torrado">{ui(mensagem)}</p> : null}</section>
  </section><ConfirmationDialog open={confirmar} title={ui("Desconectar Mercado Pago?")} description={ui("O restaurante deixará de receber novos pagamentos por esta conexão. Você poderá conectar a conta novamente depois.")} confirmLabel={ui("Desconectar")} cancelLabel={ui("Voltar")} variant="danger" loading={acao} onCancel={() => setConfirmar(false)} onConfirm={desconectar} /></div>;
}
