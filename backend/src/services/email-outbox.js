"use strict";

const { supabaseAdmin } = require("../lib/supabase");

const CATEGORIA_POR_EVENTO = {
    PLANEJAMENTO_GERADO: "ROTINA", AGENDA_DESCONECTADA: "AGENDA", AGENDA_SINCRONIZACAO_FALHOU: "AGENDA",
    RESERVA_CONFIRMADA: "RESERVA", RESERVA_CANCELADA: "RESERVA", NOVA_RESERVA: "RESERVA",
    PAGAMENTO_APROVADO: "PAGAMENTO", PAGAMENTO_REJEITADO: "PAGAMENTO", PAGAMENTO_PENDENTE: "PAGAMENTO",
    PRESENCA_CONFIRMADA: "PRESENCA", PRESENCA_RECUSADA: "PRESENCA",
    SUPORTE_CHAMADO_ABERTO: "SUPORTE", SUPORTE_RESPOSTA_RECEBIDA: "SUPORTE", SUPORTE_DECISAO_FINAL: "SUPORTE",
    FEEDBACK_DISPONIVEL: "FEEDBACK",
};

function emailHabilitado() {
    return String(process.env.APPONO_EMAIL_ENABLED ?? "false").toLowerCase() === "true";
}

function categoriaEmail(tipoEvento) {
    return CATEGORIA_POR_EVENTO[tipoEvento] ?? null;
}

function escaparHtml(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere]));
}

function urlDestino(caminho) {
    if (!caminho || !String(caminho).startsWith("/")) return null;
    const origem = String(process.env.FRONTEND_PUBLIC_URL ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").split(",")[0].trim().replace(/\/$/, "");
    return `${origem}${caminho}`;
}

function renderizarEmail({ titulo, mensagem, link_destino: linkDestino }) {
    const link = urlDestino(linkDestino);
    return {
        subject: String(titulo ?? "Atualização Appono").slice(0, 140),
        html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f7f5f2;color:#251711;font-family:Arial,sans-serif"><main style="max-width:600px;margin:0 auto;padding:32px"><section style="background:#fff;border:1px solid #e7d8c8;border-radius:18px;padding:32px"><p style="margin:0;color:#9a4f28;font-size:12px;font-weight:bold;letter-spacing:2px">APPONO</p><h1 style="margin:18px 0 12px;font-size:26px">${escaparHtml(titulo)}</h1><p style="margin:0;color:#5d514b;font-size:16px;line-height:1.6">${escaparHtml(mensagem)}</p>${link ? `<p style="margin:28px 0 0"><a href="${escaparHtml(link)}" style="display:inline-block;background:#2d1a14;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Abrir Appono</a></p>` : ""}</section><p style="color:#786b63;font-size:12px;line-height:1.5">Você recebe este e-mail por causa de uma atualização operacional da sua conta Appono. Ajuste suas preferências dentro da plataforma.</p></main></body></html>`,
    };
}

async function enfileirarEmail({ idAuth, tipoEvento, titulo, mensagem, linkDestino, dados = {}, chaveIdempotencia }) {
    const categoria = categoriaEmail(tipoEvento);
    if (!supabaseAdmin || !idAuth || !categoria || !chaveIdempotencia) return null;
    const { data, error } = await supabaseAdmin.from("email_outbox").upsert({
        id_auth_destinatario: idAuth,
        categoria,
        template: "NOTIFICACAO_OPERACIONAL_V1",
        dados: { titulo: String(titulo ?? "").slice(0, 140), mensagem: String(mensagem ?? "").slice(0, 500), link_destino: linkDestino ?? null, referencia: dados },
        chave_idempotencia: `email:${chaveIdempotencia}`.slice(0, 180),
    }, { onConflict: "chave_idempotencia", ignoreDuplicates: true }).select("id_email_outbox").maybeSingle();
    if (error) console.warn("Falha ao enfileirar e-mail:", error.message);
    return data ?? null;
}

async function enviarResend({ to, subject, html }) {
    if (!emailHabilitado()) return { simulado: true };
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) throw Object.assign(new Error("E-mail não configurado."), { code: "EMAIL_PROVIDER_NOT_CONFIGURED", permanent: true });
    const resposta = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html }),
    });
    if (!resposta.ok) {
        const erro = new Error("O provedor de e-mail recusou o envio.");
        erro.code = resposta.status === 429 ? "EMAIL_PROVIDER_RATE_LIMIT" : "EMAIL_PROVIDER_REJECTED";
        erro.permanent = resposta.status >= 400 && resposta.status < 500 && resposta.status !== 429;
        throw erro;
    }
    return resposta.json().catch(() => ({}));
}

function proximaTentativa(tentativas) {
    return new Date(Date.now() + Math.min(60, 2 ** Math.max(1, tentativas)) * 60 * 1000).toISOString();
}

function minutosHora(valor) {
    const partes = String(valor ?? "").slice(0, 5).split(":").map(Number);
    return partes.length === 2 && partes.every(Number.isFinite) ? partes[0] * 60 + partes[1] : null;
}

function horarioSilencio(preferencia, agora = new Date()) {
    const inicio = minutosHora(preferencia?.horario_silencio_inicio);
    const fim = minutosHora(preferencia?.horario_silencio_fim);
    if (inicio === null || fim === null || inicio === fim) return null;
    const partes = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit", hourCycle: "h23" }).formatToParts(agora).filter((item) => item.type !== "literal").map((item) => [item.type, item.value]));
    const atual = Number(partes.hour) * 60 + Number(partes.minute);
    const dentro = inicio < fim ? atual >= inicio && atual < fim : atual >= inicio || atual < fim;
    if (!dentro) return null;
    const terminaAmanha = inicio > fim && atual >= inicio;
    const data = new Date(`${partes.year}-${partes.month}-${partes.day}T12:00:00-03:00`);
    if (terminaAmanha) data.setDate(data.getDate() + 1);
    return new Date(`${data.toISOString().slice(0, 10)}T${String(Math.floor(fim / 60)).padStart(2, "0")}:${String(fim % 60).padStart(2, "0")}:00-03:00`).toISOString();
}

async function processarEmailsOutbox({ limite = 20, enviar = enviarResend } = {}) {
    if (!supabaseAdmin) return { processados: 0, motivo: "SUPABASE_INDISPONIVEL" };
    const { data: emails, error } = await supabaseAdmin.rpc("reclamar_emails_outbox", { p_limite: limite });
    if (error) throw error;
    let processados = 0;
    for (const item of emails ?? []) {
        const [{ data: preferencia }, usuario] = await Promise.all([
            supabaseAdmin.from("preferencias_email_notificacao").select("email_habilitado,horario_silencio_inicio,horario_silencio_fim").eq("id_auth", item.id_auth_destinatario).eq("categoria", item.categoria).maybeSingle(),
            supabaseAdmin.auth.admin.getUserById(item.id_auth_destinatario),
        ]);
        if (preferencia?.email_habilitado === false) {
            await supabaseAdmin.rpc("concluir_email_outbox", { p_id_email_outbox: item.id_email_outbox, p_status: "CANCELADO", p_erro_codigo: "EMAIL_DISABLED_OR_MISSING" });
            continue;
        }
        const silencioAte = horarioSilencio(preferencia);
        if (silencioAte) {
            await supabaseAdmin.rpc("concluir_email_outbox", { p_id_email_outbox: item.id_email_outbox, p_status: "PENDENTE", p_erro_codigo: "EMAIL_QUIET_HOURS", p_proxima_tentativa_em: silencioAte });
            continue;
        }
        if (usuario.error) {
            await supabaseAdmin.rpc("concluir_email_outbox", { p_id_email_outbox: item.id_email_outbox, p_status: "PENDENTE", p_erro_codigo: "EMAIL_USER_LOOKUP_FAILED", p_proxima_tentativa_em: proximaTentativa(item.tentativas) });
            continue;
        }
        if (!usuario.data?.user?.email) {
            await supabaseAdmin.rpc("concluir_email_outbox", { p_id_email_outbox: item.id_email_outbox, p_status: "CANCELADO", p_erro_codigo: "EMAIL_DISABLED_OR_MISSING" });
            continue;
        }
        try {
            const dados = item.dados ?? {};
            await enviar({ to: usuario.data.user.email, ...renderizarEmail(dados) });
            await supabaseAdmin.rpc("concluir_email_outbox", { p_id_email_outbox: item.id_email_outbox, p_status: "ENVIADO" });
            processados += 1;
        } catch (erro) {
            const permanente = erro?.permanent || Number(item.tentativas) >= 8;
            await supabaseAdmin.rpc("concluir_email_outbox", {
                p_id_email_outbox: item.id_email_outbox,
                p_status: permanente ? "FALHA_PERMANENTE" : "PENDENTE",
                p_erro_codigo: String(erro?.code ?? "EMAIL_SEND_FAILED").slice(0, 80),
                p_proxima_tentativa_em: permanente ? null : proximaTentativa(item.tentativas),
            });
        }
    }
    return { processados, selecionados: (emails ?? []).length, simulacao: !emailHabilitado() };
}

module.exports = { categoriaEmail, emailHabilitado, enfileirarEmail, horarioSilencio, processarEmailsOutbox, renderizarEmail };
