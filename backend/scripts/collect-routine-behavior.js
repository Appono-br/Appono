"use strict";

require("dotenv").config({ quiet: true });

const { createClient } = require("@supabase/supabase-js");
const app = require("../src/server");
const { supabaseAdmin } = require("../src/lib/supabase");
const { semanaAtual } = require("../src/domain/routine-recommendation");

const PREFIXO = "demo.rotina.cliente.";
const SUFIXO = "@example.com";

function argumentoNumerico(nome, fallback) {
    const prefixo = `--${nome}=`;
    const valor = process.argv.find((item) => item.startsWith(prefixo))?.slice(prefixo.length);
    const numero = Number(valor ?? fallback);
    if (!Number.isInteger(numero) || numero < 1 || numero > 500) throw new Error(`Argumento --${nome} invalido.`);
    return numero;
}

function somarDias(dataIso, dias) {
    const data = new Date(`${dataIso}T12:00:00Z`);
    data.setUTCDate(data.getUTCDate() + dias);
    return data.toISOString().slice(0, 10);
}

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

async function prepararCliente(base, usuario, indice, quantidadeSemanas) {
    const token = await tokenDemo(usuario);
    const controle = indice < 2;
    await requisitar(base, "/api/rotina/consentimento-personalizacao", token, {
        method: "PUT",
        body: JSON.stringify({ habilitado: !controle }),
    });
    const perfil = await requisitar(base, "/api/rotina/perfil", token);
    const primeiraSemana = semanaAtual(new Date()).inicio;
    const semanas = [];
    for (let deslocamento = 0; deslocamento < quantidadeSemanas; deslocamento += 1) {
        const semanaInicio = somarDias(primeiraSemana, deslocamento * 7);
        const anterior = await requisitar(base, `/api/rotina/planejamento?semana_inicio=${semanaInicio}`, token);
        const gerado = await requisitar(base, "/api/rotina/planejamento/gerar", token, {
            method: "POST",
            body: JSON.stringify({
                semana_inicio: semanaInicio,
                semana_base: semanaInicio,
                versao_perfil: Number(perfil.versao ?? 0),
                versao_planejamento: Number(anterior.planejamento?.versao ?? 0),
            }),
        });
        semanas.push({ semana_inicio: semanaInicio, planejamento: gerado.planejamento, refeicoes: gerado.refeicoes ?? [] });
    }
    return { conta: indice + 1, indice, token, perfil, controle, semanas };
}

async function contarSinais(clientesIds) {
    if (!clientesIds.length) return 0;
    const { count, error } = await supabaseAdmin.from("sinais_comportamentais_rotina")
        .select("*", { count: "exact", head: true })
        .in("id_cliente", clientesIds)
        .eq("consentimento_valido", true)
        .is("excluido_em", null);
    if (error) throw error;
    return count ?? 0;
}

async function idsClientes(contextos) {
    const idsAuth = contextos.filter((item) => !item.controle).map((item) => item.usuarioId);
    const { data, error } = await supabaseAdmin.from("clientes").select("id_cliente,id_auth").in("id_auth", idsAuth);
    if (error) throw error;
    return (data ?? []).map((item) => item.id_cliente);
}

async function aplicarCaso(base, contexto, semanaInicio, refeicao, acao) {
    const atual = await requisitar(base, `/api/rotina/planejamento?semana_inicio=${semanaInicio}`, contexto.token);
    const refeicaoAtual = (atual.refeicoes ?? []).find((item) => Number(item.id_refeicao_planejada) === Number(refeicao.id_refeicao_planejada));
    if (!refeicaoAtual || !atual.planejamento) return { aplicado: false, motivo: "REFEICAO_AUSENTE" };
    const estadoEsperado = { aprovar: "APROVADA", recusar: "RECUSADA", "outra-sugestao": "ALTERADA" }[acao];
    if (refeicaoAtual.status === estadoEsperado) return { aplicado: false, motivo: "JA_APLICADO" };
    const corpo = JSON.stringify({ versao_perfil: contexto.perfil.versao, versao_planejamento: atual.planejamento.versao });
    try {
        await requisitar(base, `/api/rotina/refeicoes/${refeicaoAtual.id_refeicao_planejada}/${acao}`, contexto.token, { method: "POST", body: corpo });
        return { aplicado: true, acao };
    } catch (error) {
        if (acao !== "outra-sugestao" || error.status !== 409) throw error;
        await requisitar(base, `/api/rotina/refeicoes/${refeicaoAtual.id_refeicao_planejada}/recusar`, contexto.token, { method: "POST", body: corpo });
        return { aplicado: true, acao: "recusar", fallback: true };
    }
}

async function main() {
    exigirConfirmacao();
    const alvo = argumentoNumerico("target", 100);
    const quantidadeSemanas = argumentoNumerico("weeks", 3);
    const usuarios = (await usuariosDemo()).sort((a, b) => a.email.localeCompare(b.email));
    if (usuarios.length !== 10 || usuarios.some((item) => !item.email?.startsWith(PREFIXO))) {
        throw new Error("Nenhuma conta DEMO valida encontrada.");
    }
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => { servidor.once("listening", resolve); servidor.once("error", reject); });
    const base = `http://127.0.0.1:${servidor.address().port}`;
    try {
        const contextos = [];
        for (let indice = 0; indice < usuarios.length; indice += 1) {
            const contexto = await prepararCliente(base, usuarios[indice], indice, quantidadeSemanas);
            contextos.push({ ...contexto, usuarioId: usuarios[indice].id });
        }
        const clientesIds = await idsClientes(contextos);
        let total = await contarSinais(clientesIds);
        const inicial = total;
        const resultados = [];
        const consentidos = contextos.filter((item) => !item.controle);
        for (let semanaIndice = 0; semanaIndice < quantidadeSemanas && total < alvo; semanaIndice += 1) {
            const maxRefeicoes = Math.max(...consentidos.map((item) => item.semanas[semanaIndice]?.refeicoes.length ?? 0));
            for (let refeicaoIndice = 0; refeicaoIndice < maxRefeicoes && total < alvo; refeicaoIndice += 1) {
                for (const contexto of consentidos) {
                    if (total >= alvo) break;
                    const semana = contexto.semanas[semanaIndice];
                    const refeicao = semana?.refeicoes.filter((item) => item.id_restaurante)[refeicaoIndice];
                    if (!refeicao) continue;
                    const cenarios = ["aprovar", "recusar", "outra-sugestao"];
                    const acao = cenarios[(contexto.indice + semanaIndice + refeicaoIndice) % cenarios.length];
                    const antes = total;
                    const resultado = await aplicarCaso(base, contexto, semana.semana_inicio, refeicao, acao);
                    total = await contarSinais(clientesIds);
                    resultados.push({ conta: contexto.conta, semana: semana.semana_inicio, refeicao: refeicaoIndice + 1, ...resultado, novo_sinal: total > antes });
                }
            }
        }
        console.log(JSON.stringify({ alvo, sinais_iniciais: inicial, sinais_finais: total, novos_sinais: total - inicial, contas_controle: 2, contas_consentidas: 8, semanas: quantidadeSemanas, resultados }, null, 2));
        if (total < alvo) process.exitCode = 1;
    } finally {
        await new Promise((resolve) => servidor.close(resolve));
    }
}

main().catch((error) => { console.error("ROUTINE_BEHAVIOR_COLLECTION_FAILED", error.message); process.exitCode = 1; });
