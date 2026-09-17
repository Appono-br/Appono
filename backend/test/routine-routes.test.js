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

async function ambiente(t, { role = "cliente", dono = 7, erroRpc = null, erroCodigo = null } = {}) {
    const chamadas = [];
    const refeicao = { id_refeicao_planejada: 1, id_cliente: dono, id_restaurante: 2, id_produto: 3, status: "APROVADA" };
    const banco = {
        auth: { getUser: async () => ({ data: { user: { id: "auth-cliente", email: "cliente@example.test" } } }) },
        from(tabela) {
            const filtros = {};
            return {
                select() { return this; },
                eq(campo, valor) { filtros[campo] = valor; return this; },
                order() { return this; },
                limit() { return this; },
                async maybeSingle() {
                    if (tabela === "clientes") return { data: role === "cliente" ? { id_cliente: 7 } : null };
                    if (tabela === "restaurantes") return { data: role === "restaurante" ? { id_restaurante: 2 } : null };
                    if (tabela === "refeicoes_planejadas") return { data: dono === filtros.id_cliente ? refeicao : null };
                    if (tabela === "perfis_rotina_cliente") return { data: {
                        id_perfil_rotina: 1, id_cliente: 7, versao: 1, nome: "Rotina teste", endereco_base: "Escritorio",
                        latitude: -23.5617, longitude: -46.6559,
                        horario_inicio: "12:00:00", horario_fim: "14:00:00", tempo_maximo_minutos: 60, raio_km: 5,
                        dias_semana: ["monday"], preferencias_rotina_cliente: [{tipo:"PREFERENCIA",valor:"Massa"}], restricoes_rotina_cliente: [],
                    } };
                    throw new Error(`Consulta inesperada: ${tabela}`);
                },
            };
        },
        async rpc(nome, parametros) {
            chamadas.push({ nome, parametros });
            if (erroRpc) return { error: { message: erroRpc, code: erroCodigo } };
            if (nome === "mutar_rotina") return { data: { perfil: { ...parametros.dados, versao: 2 }, preferencias: [], restricoes: [] } };
            const comPedido = parametros.com_pedido;
            return { data: {
                refeicao: { ...refeicao, status: comPedido ? "CONVERTIDA_PEDIDO" : "CONVERTIDA_RESERVA" },
                reserva: { id_reserva: 8, id_cliente: 7, id_restaurante: 2, status_reserva: comPedido ? "PENDENTE" : "CONFIRMADA" },
                pedido: comPedido ? { id_pedido: 9, id_restaurante: 2, status_pedido: "AGUARDANDO_PAGAMENTO" } : undefined,
            } };
        },
    };
    const dependencias = { "../lib/supabase": { supabaseAdmin: banco, createUserSupabaseClient: () => banco } };
    const auth = carregarModulo("../src/middleware/auth.js", dependencias);
    const { rotinaRouter } = carregarModulo("../src/routes/routine.js", {
        ...dependencias, "../middleware/auth": auth,
        "../services/pagamentos/config": { isRealMarketplace: () => false },
        "../services/notificacoes": { notificarCliente: async () => {}, notificarRestaurante: async () => {} },
    });
    const app = express();
    app.use(express.json());
    app.use("/api/rotina", rotinaRouter);
    const server = await new Promise((resolve) => { const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia)); });
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    return {
        chamadas,
        requisitar: (rota, autenticado = true, body = { versao_perfil: 1, versao_planejamento: 1 }, method = "POST") => fetch(`http://127.0.0.1:${server.address().port}/api/rotina${rota}`, {
            method, headers: { "Content-Type": "application/json", ...(autenticado ? { Authorization: "Bearer token-de-teste" } : {}) },
            body: JSON.stringify(body),
        }),
    };
}

test("rotina exige sessao e bloqueia perfil de restaurante", async (t) => {
    const ctx = await ambiente(t, { role: "restaurante" });
    assert.equal((await ctx.requisitar("/refeicoes/1/converter-reserva", false)).status, 401);
    assert.equal((await ctx.requisitar("/refeicoes/1/converter-reserva")).status, 403);
    assert.equal(ctx.chamadas.length, 0);
});

test("cliente nao converte refeicao de outro cliente", async (t) => {
    const ctx = await ambiente(t, { dono: 99 });
    assert.equal((await ctx.requisitar("/refeicoes/1/converter-reserva")).status, 404);
    assert.equal(ctx.chamadas.length, 0);
});

test("reserva simples usa conversao atomica com identidade da sessao", async (t) => {
    const ctx = await ambiente(t);
    const resposta = await ctx.requisitar("/refeicoes/1/converter-reserva");
    assert.equal(resposta.status, 201);
    assert.equal((await resposta.json()).reserva.status_reserva, "CONFIRMADA");
    assert.equal(ctx.chamadas[0].nome, "converter_refeicao_rotina");
    assert.equal(ctx.chamadas[0].parametros.refeicao_id, 1);
    assert.equal(ctx.chamadas[0].parametros.com_pedido, false);
    assert.equal(ctx.chamadas[0].parametros.id_cliente, undefined);
});

test("conversao com pedido preserva pendencia e encaminha ao checkout", async (t) => {
    const ctx = await ambiente(t);
    const resposta = await ctx.requisitar("/refeicoes/1/converter-pedido");
    const dados = await resposta.json();
    assert.equal(resposta.status, 201);
    assert.equal(dados.reserva.status_reserva, "PENDENTE");
    assert.equal(dados.checkout_href, "/cliente/pagamentos/pedido/9");
    assert.equal(ctx.chamadas[0].parametros.com_pedido, true);
});

test("falha transacional e conversao duplicada retornam conflito", async (t) => {
    const ctx = await ambiente(t, { erroRpc: "Esta refeicao ja foi convertida" });
    const resposta = await ctx.requisitar("/refeicoes/1/converter-reserva");
    assert.equal(resposta.status, 409);
    assert.match((await resposta.json()).error, /convertida/);
});

test("conversao exige versoes e nao repete sem precondicao", async (t) => {
    const ctx = await ambiente(t);
    assert.equal((await ctx.requisitar("/refeicoes/1/converter-reserva", true, {})).status, 409);
    assert.equal(ctx.chamadas.length, 0);
    const resposta = await ctx.requisitar("/refeicoes/1/converter-reserva");
    assert.equal(resposta.status, 201);
    assert.equal(ctx.chamadas[0].parametros.versao_perfil, 1);
    assert.equal(ctx.chamadas[0].parametros.versao_planejamento, 1);
});

test("feedback exige a funcao controlada e nao aceita dados de outro cliente", async (t) => {
    const ctx = await ambiente(t);
    const resposta = await ctx.requisitar("/refeicoes/1/feedback", true, {
        gostou: true, repetiria: true, motivo: "Funcionou bem", tags: ["perto"], consentiu_personalizacao: true,
    });
    assert.equal(resposta.status, 201);
    assert.equal(ctx.chamadas[0].nome, "registrar_feedback_rotina");
    assert.equal(ctx.chamadas[0].parametros.p_id_refeicao, 1);
    assert.equal(ctx.chamadas[0].parametros.id_cliente, undefined);
    const exclusao = await ctx.requisitar("/refeicoes/1/feedback", true, {}, "DELETE");
    assert.equal(exclusao.status, 204);
    assert.equal(ctx.chamadas[1].nome, "excluir_feedback_rotina");
});

test("PATCH de perfil usa um RPC atomico, identidade verificada e listas omitidas intactas", async (t) => {
    const ctx=await ambiente(t);
    const response=await ctx.requisitar("/perfil",true,{versao_perfil:1,nome:"Rotina revisada",latitude:0,longitude:0,id_cliente:99,actor_id:"invasor"},"PATCH");
    assert.equal(response.status,200);
    assert.equal((await response.json()).versao,2);
    assert.equal(ctx.chamadas.length,1);
    const params=ctx.chamadas[0].parametros;
    assert.equal(ctx.chamadas[0].nome,"mutar_rotina");
    assert.equal(params.actor_id,"auth-cliente"); assert.equal(params.operacao,"PERFIL");
    assert.equal(params.dados.endereco_base,"Escritorio"); assert.equal(params.dados.nome,"Rotina revisada");
    assert.equal(params.dados.latitude,-23.5617); assert.equal(params.dados.longitude,-46.6559);
    assert.equal(params.dados.preferencias,undefined); assert.equal(params.dados.id_cliente,undefined);
});
test("PATCH lista vazia remove e null em campo obrigatorio e rejeitado", async (t) => {
    const ctx=await ambiente(t);
    assert.equal((await ctx.requisitar("/perfil",true,{versao_perfil:1,preferencias:[]},"PATCH")).status,200);
    assert.deepEqual(ctx.chamadas[0].parametros.dados.preferencias,[]);
    for(const fields of [{preferencias:null},{tempo_maximo_minutos:null},{horario_inicio:null},{dias_semana:[]}]) {
        assert.equal((await ctx.requisitar("/perfil",true,{versao_perfil:1,...fields},"PATCH")).status,400);
    }
    assert.equal(ctx.chamadas.length,1);
});
test("perfil desatualizado e conflito de banco retornam HTTP 409 sem retry", async (t) => {
    const ctx=await ambiente(t,{erroRpc:"A rotina mudou em outra aba",erroCodigo:"PT409"});
    assert.equal((await ctx.requisitar("/perfil",true,{versao_perfil:0})).status,409);
    assert.equal(ctx.chamadas.length,0);
    assert.equal((await ctx.requisitar("/perfil",true,{versao_perfil:1})).status,409);
    assert.equal(ctx.chamadas.length,1);
});

test("conflito ao salvar janelas preserva HTTP 409 para o cliente recuperar a versao", async (t) => {
    const ctx = await ambiente(t, { erroRpc: "A rotina mudou em outra aba", erroCodigo: "PT409" });
    const resposta = await ctx.requisitar("/perfil", true, {
        versao_perfil: 1,
        janelas_alimentacao: [{
            tipo: "ALMOCO", nome: "Almoço", dias_semana: ["monday"],
            horario_inicio: "12:00", horario_fim: "14:00", tempo_maximo_minutos: 60,
            raio_km: 5, ativa: true, ordem: 0,
        }],
    });
    assert.equal(resposta.status, 409);
});
