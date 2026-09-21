"use strict";

const dotenv = require("dotenv");

dotenv.config({ quiet: true });
process.env.APPONO_ROTINA_SHADOW_ENABLED = "true";

const { createClient } = require("@supabase/supabase-js");
const app = require("../src/server");
const { supabaseAdmin } = require("../src/lib/supabase");
const { semanaPlanejamento } = require("../src/domain/routine-recommendation");

const DEMO_EMAIL_PREFIX = "demo.rotina.cliente.";
const DEMO_EMAIL_SUFFIX = "@example.com";

function exigirConfiguracao() {
    if (process.env.APPONO_REMOTE_SMOKE !== "confirmado" && !process.argv.includes("--confirmado")) {
        throw new Error("Defina APPONO_REMOTE_SMOKE=confirmado ou use --confirmado para executar o teste remoto.");
    }
    for (const nome of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"]) {
        if (!process.env[nome]) throw new Error(`Variavel obrigatoria ausente: ${nome}`);
    }
    if (!supabaseAdmin) throw new Error("Cliente administrativo do Supabase indisponivel.");
}

async function listarClientesDemo() {
    const usuarios = [];
    for (let pagina = 1; pagina <= 20; pagina += 1) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
        if (error) throw error;
        usuarios.push(...(data.users ?? []));
        if ((data.users ?? []).length < 1000) break;
    }
    return usuarios.filter((usuario) => usuario.email?.startsWith(DEMO_EMAIL_PREFIX)
        && usuario.email.endsWith(DEMO_EMAIL_SUFFIX));
}

function semanaDoPerfil(perfil) {
    const janelas = Array.isArray(perfil.janelas_alimentacao) ? perfil.janelas_alimentacao.filter((item) => item.ativa !== false) : [];
    const dias = [...new Set((janelas.length ? janelas : [perfil]).flatMap((item) => item.dias_semana ?? []))];
    const fim = (janelas.length ? janelas : [perfil]).map((item) => item.horario_fim).filter(Boolean).sort().at(-1) ?? perfil.horario_fim;
    return semanaPlanejamento(new Date(), dias, fim).inicio;
}

async function requisitar(baseUrl, caminho, token, options = {}) {
    const resposta = await fetch(`${baseUrl}${caminho}`, {
        ...options,
        headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            ...(options.headers ?? {}),
        },
    });
    const corpo = resposta.status === 204 ? null : await resposta.json().catch(() => null);
    if (!resposta.ok) {
        const erro = new Error(corpo?.error ?? `HTTP ${resposta.status}`);
        erro.status = resposta.status;
        erro.code = corpo?.code;
        throw erro;
    }
    return corpo;
}

async function gerarParaCliente(baseUrl, usuario) {
    const auth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    let login;
    let loginError;
    if (process.env.APPONO_DEMO_PASSWORD) {
        ({ data: login, error: loginError } = await auth.auth.signInWithPassword({
            email: usuario.email,
            password: process.env.APPONO_DEMO_PASSWORD,
        }));
    } else {
        const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: usuario.email,
        });
        if (linkError || !link?.properties?.hashed_token) throw linkError ?? new Error("Token efemero de teste nao criado.");
        ({ data: login, error: loginError } = await auth.auth.verifyOtp({
            token_hash: link.properties.hashed_token,
            type: "email",
        }));
    }
    if (loginError || !login.session?.access_token) throw loginError ?? new Error("Sessao de teste nao criada.");
    const token = login.session.access_token;
    const perfil = await requisitar(baseUrl, "/api/rotina/perfil", token);
    const semanaInicio = semanaDoPerfil(perfil);
    const anterior = await requisitar(baseUrl, `/api/rotina/planejamento?semana_inicio=${semanaInicio}`, token);
    const gerado = await requisitar(baseUrl, "/api/rotina/planejamento/gerar", token, {
        method: "POST",
        body: JSON.stringify({
            semana_inicio: semanaInicio,
            semana_base: semanaInicio,
            versao_perfil: Number(perfil.versao ?? 0),
            versao_planejamento: Number(anterior.planejamento?.versao ?? 0),
        }),
    });
    return {
        email: usuario.email,
        semana_inicio: semanaInicio,
        id_planejamento_rotina: gerado.planejamento?.id_planejamento_rotina,
        sugestoes: (gerado.refeicoes ?? []).filter((item) => item.id_restaurante).length,
    };
}

async function coletarMetricas(idsPlanejamentos) {
    const { data, error } = await supabaseAdmin.from("avaliacoes_sombra_rotina")
        .select("modelo_desafiante,id_refeicao_planejada,id_restaurante_controle,id_produto_controle,id_restaurante_desafiante,id_produto_desafiante,divergiu,confianca_desafiante,amostras_desafiante,volume_efetivo_desafiante,consistencia_desafiante,falhou")
        .in("id_planejamento_rotina", idsPlanejamentos);
    if (error) throw error;
    const linhas = data ?? [];
    return Object.fromEntries([...new Set(linhas.map((item) => item.modelo_desafiante))].sort().map((modelo) => {
        const grupo = linhas.filter((item) => item.modelo_desafiante === modelo);
        const divergencias = grupo.filter((item) => item.divergiu).length;
        const confiancas = grupo.map((item) => Number(item.confianca_desafiante)).filter(Number.isFinite);
        const volumes = grupo.map((item) => Number(item.volume_efetivo_desafiante)).filter(Number.isFinite);
        return [modelo, {
            comparacoes: grupo.length,
            concordancias: grupo.length - divergencias,
            divergencias,
            taxa_divergencia: grupo.length ? Number((divergencias / grupo.length).toFixed(4)) : 0,
            confianca_media_desafiante: confiancas.length
                ? Number((confiancas.reduce((total, item) => total + item, 0) / confiancas.length).toFixed(4))
                : null,
            distribuicao_confianca: {
                zero: confiancas.filter((item) => item === 0).length,
                muito_baixa: confiancas.filter((item) => item > 0 && item < 0.25).length,
                baixa: confiancas.filter((item) => item >= 0.25 && item < 0.5).length,
                moderada: confiancas.filter((item) => item >= 0.5 && item < 0.75).length,
                alta: confiancas.filter((item) => item >= 0.75).length,
            },
            volume_efetivo_medio: volumes.length
                ? Number((volumes.reduce((total, item) => total + item, 0) / volumes.length).toFixed(4))
                : null,
            comparacoes_com_historico: grupo.filter((item) => Number(item.amostras_desafiante) > 0).length,
            comparacoes_sem_historico: grupo.filter((item) => Number(item.amostras_desafiante) === 0).length,
            falhas_modelo: grupo.filter((item) => item.falhou).length,
        }];
    }));
}

async function main() {
    exigirConfiguracao();
    const usuarios = await listarClientesDemo();
    if (usuarios.length !== 10) throw new Error(`Esperados 10 clientes ficticios; encontrados ${usuarios.length}.`);
    const servidor = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        servidor.once("listening", resolve);
        servidor.once("error", reject);
    });
    const endereco = servidor.address();
    const baseUrl = `http://127.0.0.1:${endereco.port}`;
    try {
        const resultados = [];
        for (const usuario of usuarios.sort((a, b) => a.email.localeCompare(b.email))) {
            try {
                resultados.push({ ok: true, ...(await gerarParaCliente(baseUrl, usuario)) });
            } catch (error) {
                resultados.push({ ok: false, email: usuario.email, status: error.status ?? null, code: error.code ?? null, error: error.message });
            }
        }
        let metricas = null;
        let erroMetricas = null;
        try {
            const idsPlanejamentos = resultados.filter((item) => item.ok && item.id_planejamento_rotina)
                .map((item) => item.id_planejamento_rotina);
            metricas = idsPlanejamentos.length ? await coletarMetricas(idsPlanejamentos) : {};
        } catch (error) {
            erroMetricas = { code: error.code ?? null, error: error.message };
        }
        const relatorio = {
            clientes_testados: resultados.length,
            clientes_com_sucesso: resultados.filter((item) => item.ok).length,
            clientes_com_falha: resultados.filter((item) => !item.ok).length,
            sugestoes_oficiais: resultados.reduce((total, item) => total + Number(item.sugestoes ?? 0), 0),
            metricas_sombra: metricas,
            erro_metricas_sombra: erroMetricas,
            resultados,
        };
        console.log(JSON.stringify(relatorio, null, 2));
        const modelosEsperados = ["appono-intelligence-v1", "appono-intelligence-v2"];
        if (relatorio.clientes_com_falha || modelosEsperados.some((modelo) => !metricas?.[modelo]?.comparacoes)) process.exitCode = 1;
    } finally {
        await new Promise((resolve) => servidor.close(resolve));
    }
}

main().catch((error) => {
    console.error("ROUTINE_SHADOW_TEST_FAILED", error.message);
    process.exitCode = 1;
});
