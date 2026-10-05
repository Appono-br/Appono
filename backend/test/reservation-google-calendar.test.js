"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { createRequire } = require("node:module");
const express = require("express");

function carregarModulo(arquivo, substituicoes) {
    const caminho = path.resolve(__dirname, arquivo);
    const requireReal = createRequire(caminho);
    const modulo = { exports: {} };
    const executar = vm.runInThisContext(`(function(require, module, exports) {\n${fs.readFileSync(caminho, "utf8")}\n})`, { filename: caminho });
    executar((nome) => substituicoes[nome] ?? requireReal(nome), modulo, modulo.exports);
    return modulo.exports;
}

function criarBanco({ status = "CONFIRMADA", dono = 7, conexao = {}, vinculo = null } = {}) {
    const tabelas = {
        clientes: [{ id_cliente: 7, id_auth: "auth-cliente" }],
        restaurantes: [],
        reservas: [{
            id_reserva: 12, id_cliente: dono, id_restaurante: 3, status_reserva: status,
            data_reserva: "2026-10-07", horario_inicio: "19:00:00", horario_fim: "20:30:00",
            quantidade_pessoas: 2, restaurantes: { nome: "Restaurante Sintético", endereco: "Rua de Teste, 10" },
        }],
        conexoes_agenda_cliente: [{
            id_conexao_agenda: 91, id_cliente: dono, provedor: "GOOGLE", status: "CONECTADO",
            escopos: ["https://www.googleapis.com/auth/calendar.events.owned"],
            token_acesso_cifrado: "encrypted-access", token_refresh_cifrado: "encrypted-refresh",
            expiracao_token: new Date(Date.now() + 3600_000).toISOString(), ...conexao,
        }],
        eventos_reserva_agenda: vinculo ? [{ ...vinculo }] : [],
    };
    const chamadas = [];
    const clone = (valor) => valor == null ? valor : JSON.parse(JSON.stringify(valor));
    const matches = (row, filtros) => Object.entries(filtros).every(([campo, valor]) => String(row?.[campo]) === String(valor));

    function query(tabela) {
        const filtros = {};
        let operacao = "select";
        let dados;
        let conflito;
        let colunas;
        const consulta = {
            select(selecao) { colunas = selecao; return this; },
            eq(campo, valor) { filtros[campo] = valor; return this; },
            in(campo, valores) { this._in = { campo, valores }; return this; },
            order() { return this; },
            limit() { return this; },
            upsert(valor, opcoes) { operacao = "upsert"; dados = valor; conflito = opcoes?.onConflict; return this; },
            update(valor) { operacao = "update"; dados = valor; return this; },
            insert(valor) { operacao = "insert"; dados = valor; return this; },
            async maybeSingle() { const resultado = await resolver(); return { data: resultado.rows[0] ?? null, error: resultado.error }; },
            async single() { const resultado = await resolver(); return { data: resultado.rows[0] ?? null, error: resultado.error }; },
            then(resolve, reject) { return resolver().then(resolve, reject); },
        };
        async function resolver() {
            chamadas.push({ tabela, operacao, filtros: { ...filtros }, dados: clone(dados), colunas });
            if (operacao === "upsert") {
                const chave = conflito?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
                const existente = tabelas[tabela].find((row) => chave.length > 0 && chave.every((campo) => String(row[campo]) === String(dados[campo])));
                if (existente) Object.assign(existente, clone(dados));
                else tabelas[tabela].push(clone(dados));
                return { rows: [], error: null };
            }
            if (operacao === "insert") {
                tabelas[tabela].push(clone(dados));
                return { rows: [], error: null };
            }
            if (operacao === "update") {
                const atualizados = tabelas[tabela].filter((row) => matches(row, filtros) &&
                    (!consulta._in || consulta._in.valores.includes(row[consulta._in.campo])));
                atualizados.forEach((row) => Object.assign(row, clone(dados)));
                return { rows: atualizados.map(clone), error: null };
            }
            let rows = (tabelas[tabela] ?? []).filter((row) => matches(row, filtros));
            if (consulta._in) rows = rows.filter((row) => consulta._in.valores.includes(row[consulta._in.campo]));
            return { rows: rows.map(clone), error: null };
        }
        return consulta;
    }
    return {
        tabelas,
        chamadas,
        auth: { getUser: async () => ({ data: { user: { id: "auth-cliente", email: "cliente@example.test" } } }) },
        from: query,
        createUserSupabaseClient: () => this,
    };
}

async function ambiente(t, opcoes = {}) {
    const banco = criarBanco(opcoes);
    const chamadasGoogle = [];
    let falharSalvar = false;
    let falharExcluir = false;
    const provider = {
        buscarOcupacao: async () => ({}),
        configuracaoProvedor: () => ({ enabled: true, configured: true, scopes: [] }),
        criarUrlAutorizacao: () => "https://accounts.google.test/oauth",
        identificarConta: async () => "conta-sintetica",
        podeEscreverGoogle: (escopos) => escopos?.includes("https://www.googleapis.com/auth/calendar.events.owned"),
        renovarToken: async () => ({ access_token: "refreshed-access" }),
        trocarCodigo: async () => ({ access_token: "access", refresh_token: "refresh" }),
        salvarEventoGoogle: async (entrada) => {
            chamadasGoogle.push({ operacao: "salvar", entrada });
            if (falharSalvar) throw Object.assign(new Error("Google indisponível"), { code: "CALENDAR_EVENT_CREATE_FAILED" });
            return { id: entrada.eventoId };
        },
        excluirEventoGoogle: async (entrada) => {
            chamadasGoogle.push({ operacao: "excluir", entrada });
            if (falharExcluir) throw Object.assign(new Error("Google indisponível"), { code: "CALENDAR_EVENT_DELETE_FAILED" });
        },
    };
    const auth = carregarModulo("../src/middleware/auth.js", {
        "../lib/supabase": { supabaseAdmin: banco, supabaseAuth: banco, createUserSupabaseClient: () => banco },
    });
    const { agendaRotinaRouter, montarEventoReservaGoogle } = carregarModulo("../src/routes/routine-calendar.js", {
        "../lib/supabase": { supabaseAdmin: banco },
        "../middleware/auth": auth,
        "../services/agenda/crypto": { cifrar: (valor) => `cifrado:${valor}`, decifrar: (valor) => valor === "encrypted-access" ? "secret-access-token" : valor },
        "../services/agenda/providers": provider,
        "../services/agenda/planning-events": { hashEvento: () => "hash-evento-sintetico", idEventoGoogle: () => "planejamento", montarEventoGoogle: () => ({}) },
    });
    const app = express();
    app.use(express.json());
    app.use("/api/rotina/agenda", agendaRotinaRouter);
    const server = await new Promise((resolve) => { const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia)); });
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    return {
        banco, chamadasGoogle, montarEventoReservaGoogle,
        falharSalvar: (valor) => { falharSalvar = valor; },
        falharExcluir: (valor) => { falharExcluir = valor; },
        requisitar: (rota, { method = "POST", autenticado = true } = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/rotina/agenda${rota}`, {
            method, headers: { "Content-Type": "application/json", ...(autenticado ? { Authorization: "Bearer token-de-teste" } : {}) },
        }),
    };
}

test("evento de reserva usa horário local, timezone e metadado privado", () => {
    const { montarEventoReservaGoogle } = { montarEventoReservaGoogle: carregarModulo("../src/routes/routine-calendar.js", {
        "../lib/supabase": { supabaseAdmin: null },
        "../services/agenda/crypto": { cifrar: () => "x", decifrar: () => "x" },
        "../services/agenda/providers": {},
        "../services/agenda/planning-events": {},
    }).montarEventoReservaGoogle };
    const evento = montarEventoReservaGoogle({ id_reserva: 12, data_reserva: "2026-10-07", horario_inicio: "19:00:00", horario_fim: "20:30:00", quantidade_pessoas: 2, restaurantes: { nome: "Teste", endereco: "Rua A" } }, "https://app.test");
    assert.equal(evento.start.dateTime, "2026-10-07T19:00:00");
    assert.equal(evento.end.dateTime, "2026-10-07T20:30:00");
    assert.equal(evento.start.timeZone, "America/Sao_Paulo");
    assert.equal(evento.extendedProperties.private.appono_reserva_id, "12");
    assert.doesNotMatch(JSON.stringify(evento), /secret|token|cpf|pagamento/i);
});

test("endpoints protegem sessão, propriedade, status e escopo", async (t) => {
    const semSessao = await ambiente(t);
    assert.equal((await semSessao.requisitar("/google/reservas/12/exportar", { autenticado: false })).status, 401);

    const outroCliente = await ambiente(t, { dono: 99 });
    const respostaOutro = await outroCliente.requisitar("/google/reservas/12/exportar");
    assert.equal(respostaOutro.status, 404);

    const naoConfirmada = await ambiente(t, { status: "PENDENTE" });
    assert.equal((await naoConfirmada.requisitar("/google/reservas/12/exportar")).status, 409);

    const semEscopo = await ambiente(t, { conexao: { escopos: ["https://www.googleapis.com/auth/calendar.readonly"] } });
    const respostaEscopo = await semEscopo.requisitar("/google/reservas/12/exportar");
    assert.equal(respostaEscopo.status, 409);
    assert.equal((await respostaEscopo.json()).code, "CALENDAR_WRITE_SCOPE_REQUIRED");
});

test("criação é idempotente, atualiza o mesmo evento e não expõe token", async (t) => {
    const ctx = await ambiente(t);
    const primeira = await ctx.requisitar("/google/reservas/12/exportar");
    const primeiraJson = await primeira.json();
    const segunda = await ctx.requisitar("/google/reservas/12/exportar");
    const segundaJson = await segunda.json();
    assert.equal(primeira.status, 200);
    assert.equal(segunda.status, 200);
    assert.equal(ctx.banco.tabelas.eventos_reserva_agenda.length, 1);
    assert.equal(ctx.chamadasGoogle.filter((item) => item.operacao === "salvar").length, 2);
    assert.equal(primeiraJson.agenda_google.evento_externo_id, segundaJson.agenda_google.evento_externo_id);
    assert.doesNotMatch(JSON.stringify(primeiraJson), /secret-access-token|refresh-token|encrypted/i);

    const reserva = ctx.banco.tabelas.reservas[0];
    reserva.horario_inicio = "20:00:00";
    reserva.horario_fim = "21:30:00";
    const atualizacao = await ctx.requisitar("/google/reservas/12", { method: "PATCH" });
    assert.equal(atualizacao.status, 200);
    const ultima = ctx.chamadasGoogle.at(-1).entrada;
    assert.equal(ultima.eventoId, primeiraJson.agenda_google.evento_externo_id);
    assert.equal(ultima.evento.start.dateTime, "2026-10-07T20:00:00");
});

test("falha do Google marca sincronização sem alterar a reserva", async (t) => {
    const ctx = await ambiente(t);
    ctx.falharSalvar(true);
    const resposta = await ctx.requisitar("/google/reservas/12/exportar");
    const json = await resposta.json();
    assert.equal(resposta.status, 422);
    assert.equal(json.code, "CALENDAR_EVENT_CREATE_FAILED");
    assert.equal(ctx.banco.tabelas.reservas[0].status_reserva, "CONFIRMADA");
    assert.equal(ctx.banco.tabelas.eventos_reserva_agenda[0].status, "FALHOU");
    assert.doesNotMatch(JSON.stringify(json), /secret-access-token|refresh-token/i);
});

test("cancelamento é idempotente e preserva a reserva Appono", async (t) => {
    const ctx = await ambiente(t, { vinculo: {
        id_evento_reserva_agenda: 501, id_cliente: 7, id_reserva: 12, id_conexao_agenda: 91,
        provedor: "GOOGLE", calendario_externo_id: "primary", evento_externo_id: "apponoreserva-evento", status: "SINCRONIZADO",
    } });
    const primeira = await ctx.requisitar("/google/reservas/12", { method: "DELETE" });
    const primeiraJson = await primeira.json();
    const segunda = await ctx.requisitar("/google/reservas/12", { method: "DELETE" });
    const segundaJson = await segunda.json();
    assert.equal(primeira.status, 200);
    assert.equal(primeiraJson.removido, true);
    assert.equal(segunda.status, 200);
    assert.equal(segundaJson.removido, false);
    assert.equal(ctx.chamadasGoogle.filter((item) => item.operacao === "excluir").length, 1);
    assert.equal(ctx.banco.tabelas.eventos_reserva_agenda[0].status, "REMOVIDO");
    assert.equal(ctx.banco.tabelas.reservas[0].status_reserva, "CONFIRMADA");
});

test("duas remoções simultâneas usam uma única reivindicação externa", async (t) => {
    const ctx = await ambiente(t, { vinculo: {
        id_evento_reserva_agenda: 502, id_cliente: 7, id_reserva: 12, id_conexao_agenda: 91,
        provedor: "GOOGLE", calendario_externo_id: "primary", evento_externo_id: "apponoreserva-evento-2", status: "SINCRONIZADO",
    } });
    const respostas = await Promise.all([
        ctx.requisitar("/google/reservas/12", { method: "DELETE" }),
        ctx.requisitar("/google/reservas/12", { method: "DELETE" }),
    ]);
    assert.ok(respostas.every((resposta) => [200, 202].includes(resposta.status)));
    assert.equal(ctx.chamadasGoogle.filter((item) => item.operacao === "excluir").length, 1);
    assert.equal(ctx.banco.tabelas.eventos_reserva_agenda[0].status, "REMOVIDO");
});

test("provedor recupera conflito de criação concorrente atualizando o evento determinístico", async () => {
    const { salvarEventoGoogle } = require("../src/services/agenda/providers");
    const fetchOriginal = global.fetch;
    const requisicoes = [];
    global.fetch = async (_url, opcoes) => {
        const metodo = opcoes.method ?? "GET";
        requisicoes.push(metodo);
        if (metodo === "GET") return { ok: false, status: 404, json: async () => ({}) };
        if (metodo === "POST") return { ok: false, status: 409, json: async () => ({ error: { message: "Already exists" } }) };
        return { ok: true, status: 200, json: async () => ({ id: "evento-concorrente" }) };
    };
    try {
        await salvarEventoGoogle({ accessToken: "secret-access-token", eventoId: "apponoreserva-concorrente", evento: { summary: "Teste" } });
        assert.deepEqual(requisicoes, ["GET", "POST", "PATCH"]);
    } finally {
        global.fetch = fetchOriginal;
    }
});
