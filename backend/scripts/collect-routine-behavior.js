"use strict";

require("dotenv").config({ quiet: true });

const { createClient } = require("@supabase/supabase-js");
const app = require("../src/server");
const { supabaseAdmin } = require("../src/lib/supabase");

const PREFIXO = "demo.rotina.cliente.";
const SUFIXO = "@example.com";

function exigirConfirmacao() {
    if (process.env.APPONO_REMOTE_SMOKE !== "confirmado" && !process.argv.includes("--confirmado")) {
        throw new Error("Use APPONO_REMOTE_SMOKE=confirmado ou --confirmado em desenvolvimento.");
    }
    if (!supabaseAdmin || !process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
        throw new Error("Configuracao Supabase de desenvolvimento incompleta.");
    }
}

async function usuariosDemo() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return (data.users ?? []).filter((usuario) => usuario.email?.startsWith(PREFIXO) && usuario.email.endsWith(SUFIXO));
}

async function tokenDemo(usuario) {
    const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    let autenticacao;
    let erro;
    if (process.env.APPONO_DEMO_PASSWORD) {
        ({ data: autenticacao, error: erro } = await cliente.auth.signInWithPassword({ email: usuario.email, password: process.env.APPONO_DEMO_PASSWORD }));
    } else {
        const { data: link, error: erroLink } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: usuario.email });
        if (erroLink) throw erroLink;
        ({ data: autenticacao, error: erro } = await cliente.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "email" }));
    }
    if (erro || !autenticacao.session?.access_token) throw erro ?? new Error("Sessao DEMO indisponivel.");
    return autenticacao.session.access_token;
}

async function requisitar(base, caminho, token, options = {}) {
    const resposta = await fetch(`${base}${caminho}`, { ...options, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" } });
    const corpo = resposta.status === 204 ? null : await resposta.json().catch(() => null);
    if (!resposta.ok) throw Object.assign(new Error(corpo?.error ?? `HTTP ${resposta.status}`), { status: resposta.status, code: corpo?.code });
    return corpo;
}

async function coletarCliente(base, usuario, indice) {
    const token = await tokenDemo(usuario);
    const controle = indice < 2;
    await requisitar(base, "/api/rotina/consentimento-personalizacao", token, {
        method: "PUT",
        body: JSON.stringify({ habilitado: !controle }),
    });
    const perfil = await requisitar(base, "/api/rotina/perfil", token);
    const { planejamento, refeicoes } = await requisitar(base, "/api/rotina/planejamento", token);
    const refeicao = (refeicoes ?? []).find((item) => item.id_restaurante && !["CONVERTIDA_RESERVA", "CONVERTIDA_PEDIDO", "CANCELADA"].includes(item.status));
    if (controle || !planejamento || !refeicao) return { conta: indice + 1, grupo: controle ? "CONTROLE" : "SEM_REFEICAO", acao: "NENHUMA" };
    const cenarios = ["aprovar", "recusar", "outra-sugestao"];
    const acao = cenarios[(indice - 2) % cenarios.length];
    const estadoEsperado = { aprovar: "APROVADA", recusar: "RECUSADA", "outra-sugestao": "ALTERADA" }[acao];
    if (refeicao.status === estadoEsperado) {
        return { conta: indice + 1, grupo: "CONSENTIDO", acao: `${acao.toUpperCase()}_JA_APLICADA` };
    }
    const corpo = JSON.stringify({ versao_perfil: perfil.versao, versao_planejamento: planejamento.versao });
    await requisitar(base, `/api/rotina/refeicoes/${refeicao.id_refeicao_planejada}/${acao}`, token, { method: "POST", body: corpo });
    return { conta: indice + 1, grupo: "CONSENTIDO", acao: acao.toUpperCase() };
}

async function main() {
    exigirConfirmacao();
    const usuarios = (await usuariosDemo()).sort((a, b) => a.email.localeCompare(b.email));
    if (!usuarios.length || usuarios.some((item) => !item.email?.includes("[DEMO]") && !item.email?.startsWith(PREFIXO))) {
        throw new Error("Nenhuma conta DEMO valida encontrada.");
    }
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { servidor.once("listening", resolve); servidor.once("error", reject); });
    const base = `http://127.0.0.1:${servidor.address().port}`;
    try {
        const resultados = [];
        for (let indice = 0; indice < usuarios.length; indice += 1) {
            try { resultados.push({ ok: true, ...(await coletarCliente(base, usuarios[indice], indice)) }); }
            catch (error) { resultados.push({ ok: false, conta: indice + 1, status: error.status ?? null, code: error.code ?? null, erro: error.message }); }
        }
        console.log(JSON.stringify({ contas_demo: usuarios.length, sucessos: resultados.filter((item) => item.ok).length, resultados }, null, 2));
        if (resultados.some((item) => !item.ok)) process.exitCode = 1;
    } finally {
        await new Promise((resolve) => servidor.close(resolve));
    }
}

main().catch((error) => { console.error("ROUTINE_BEHAVIOR_COLLECTION_FAILED", error.message); process.exitCode = 1; });
