"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
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

function clonarReserva(reserva) {
    return { ...reserva, clientes: { ...reserva.clientes }, restaurantes: { nome: "Restaurante Teste", endereco: "Rua de Teste" }, mesas: { numero_mesa: 4, capacidade: 4 } };
}

class BancoAtendimento {
    constructor({ status = "CONFIRMADA", orders = [], updateDelayMs = 0, restauranteDisponivel = true, outroRestaurante = false } = {}) {
        this.restaurante = restauranteDisponivel ? { id_restaurante: 42, id_auth: "auth-restaurante" } : null;
        this.reserva = {
            id_reserva: 9,
            id_cliente: 7,
            id_restaurante: outroRestaurante ? 99 : 42,
            status_reserva: status,
            data_reserva: "2000-01-01",
            horario_inicio: "12:00:00",
            horario_fim: "14:00:00",
            clientes: { nome: "Cliente Teste", telefone: "11999999999" },
        };
        this.orders = orders;
        this.updateDelayMs = updateDelayMs;
        this.auditorias = [];
        this.notifications = [];
        this.updateAttempts = 0;
    }

    from(tabela) {
        return new Query(this, tabela);
    }
}

class Query {
    constructor(banco, tabela) {
        this.banco = banco;
        this.tabela = tabela;
        this.filtros = {};
        this.negacoes = [];
        this.payload = null;
        this.operacao = "select";
    }

    select() { return this; }
    eq(campo, valor) { this.filtros[campo] = valor; return this; }
    not(campo, operador, valor) { this.negacoes.push({ campo, operador, valor }); return this; }
    update(payload) { this.operacao = "update"; this.payload = payload; return this; }
    insert(payload) {
        this.operacao = "insert";
        this.payload = payload;
        this.banco.auditorias.push({ ...payload });
        return Promise.resolve({ data: payload, error: null });
    }

    async maybeSingle() {
        if (this.tabela === "clientes") return { data: null, error: null };
        if (this.tabela === "restaurantes") {
            const encontrou = this.banco.restaurante && this.filtros.id_auth === this.banco.restaurante.id_auth;
            return { data: encontrou ? { ...this.banco.restaurante } : null, error: null };
        }
        if (this.tabela === "reservas") return { data: this.encontrarReserva(), error: null };
        return { data: null, error: null };
    }

    async single() {
        if (this.tabela !== "reservas" || this.operacao !== "update") return { data: null, error: { message: "Consulta inesperada" } };
        this.banco.updateAttempts += 1;
        if (this.banco.updateDelayMs) await new Promise((resolve) => setTimeout(resolve, this.banco.updateDelayMs));
        const reserva = this.encontrarReserva();
        if (!reserva) return { data: null, error: { code: "PGRST116", message: "No rows found" } };
        Object.assign(this.banco.reserva, this.payload);
        return { data: clonarReserva(this.banco.reserva), error: null };
    }

    async execute() {
        if (this.tabela !== "pedidos") return { data: [], error: null };
        const abertos = this.banco.orders.filter((pedido) => {
            if (pedido.id_reserva !== this.filtros.id_reserva) return false;
            return !["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido);
        });
        return { data: abertos, error: null };
    }

    then(resolve, reject) {
        return this.execute().then(resolve, reject);
    }

    encontrarReserva() {
        for (const [campo, valor] of Object.entries(this.filtros)) {
            if (campo === "id_reserva" && Number(valor) !== this.banco.reserva.id_reserva) return null;
            if (campo === "id_restaurante" && Number(valor) !== this.banco.reserva.id_restaurante) return null;
            if (campo === "status_reserva" && this.banco.reserva.status_reserva !== valor) return null;
        }
        return clonarReserva(this.banco.reserva);
    }
}

async function ambiente(t, opcoes = {}) {
    const banco = new BancoAtendimento(opcoes);
    const supabase = {
        auth: { getUser: async () => ({ data: { user: { id: "auth-restaurante", email: "restaurante@example.test" } }, error: null }) },
    };
    supabase.from = banco.from.bind(banco);
    const dependencias = {
        "../lib/supabase": { supabaseAdmin: supabase, supabaseAuth: supabase, createUserSupabaseClient: () => supabase },
    };
    const auth = carregarModulo("../src/middleware/auth.js", dependencias);
    const notificacoes = {
        notificarCliente: async (id, payload) => {
            if (opcoes.falharNotificacoes) throw new Error("notification unavailable");
            banco.notifications.push({ destino: "cliente", id, payload });
        },
        notificarRestaurante: async (id, payload) => {
            if (opcoes.falharNotificacoes) throw new Error("notification unavailable");
            banco.notifications.push({ destino: "restaurante", id, payload });
        },
    };
    const { reservationsRouter } = carregarModulo("../src/routes/reservations.js", {
        ...dependencias,
        "../middleware/auth": auth,
        "../services/notificacoes": notificacoes,
        "../services/reservas/expiracao": { sincronizarReservasNaoComparecidas: async () => {} },
        "../services/pagamentos/refund": { refundApprovedPayments: async () => [] },
        "../services/pagamentos/config": { isRealMarketplace: () => false },
    });
    const app = express();
    app.use(express.json());
    app.use("/api/reservas", reservationsRouter);
    const server = await new Promise((resolve) => {
        const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));
    });
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    return {
        banco,
        requisitar: (rota, { autenticado = true, codigo = "9999" } = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/reservas${rota}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...(autenticado ? { Authorization: "Bearer token-de-teste" } : {}) },
            body: JSON.stringify({ codigo_telefone: codigo }),
        }),
    };
}

test("check-in exige autenticação e valida o código do telefone", async (t) => {
    const ctx = await ambiente(t);
    assert.equal((await ctx.requisitar("/9/check-in", { autenticado: false })).status, 401);
    const resposta = await ctx.requisitar("/9/check-in", { codigo: "1234" });
    assert.equal(resposta.status, 422);
    assert.equal((await resposta.json()).code, "CHECK_IN_PHONE_CODE_INVALID");
    assert.equal(ctx.banco.auditorias.at(-1).resultado, "CODIGO_INVALIDO");
});

test("check-in bloqueia perfil que não é restaurante e reserva de outro restaurante", async (t) => {
    const semRestaurante = await ambiente(t, { restauranteDisponivel: false });
    assert.equal((await semRestaurante.requisitar("/9/check-in")).status, 403);

    const outroRestaurante = await ambiente(t, { outroRestaurante: true });
    assert.equal((await outroRestaurante.requisitar("/9/check-in")).status, 404);
});

test("check-in bem-sucedido altera a reserva, audita e notifica os dois lados", async (t) => {
    const ctx = await ambiente(t);
    const resposta = await ctx.requisitar("/9/check-in");
    assert.equal(resposta.status, 200);
    assert.equal(ctx.banco.reserva.status_reserva, "CHECK_IN");
    assert.equal(ctx.banco.auditorias.at(-1).codigo_tecnico, "CHECK_IN_RECORDED");
    assert.deepEqual(ctx.banco.notifications.map((item) => item.destino).sort(), ["cliente", "restaurante"]);
});

test("falha de notificação não desfaz check-in ou check-out persistido", async (t) => {
    const checkIn = await ambiente(t, { falharNotificacoes: true });
    assert.equal((await checkIn.requisitar("/9/check-in")).status, 200);
    assert.equal(checkIn.banco.reserva.status_reserva, "CHECK_IN");

    const checkOut = await ambiente(t, { status: "CHECK_IN", falharNotificacoes: true });
    assert.equal((await checkOut.requisitar("/9/concluir")).status, 200);
    assert.equal(checkOut.banco.reserva.status_reserva, "CONCLUIDA");
});

test("check-in audita status inválido e janela inválida", async (t) => {
    const statusInvalido = await ambiente(t, { status: "CANCELADA" });
    assert.equal((await statusInvalido.requisitar("/9/check-in")).status, 409);
    assert.equal(statusInvalido.banco.auditorias.at(-1).resultado, "STATUS_INVALIDO");

    const janela = await ambiente(t);
    janela.banco.reserva.data_reserva = "2099-01-01";
    assert.equal((await janela.requisitar("/9/check-in")).status, 409);
    assert.equal(janela.banco.auditorias.at(-1).resultado, "JANELA_INVALIDA");
});

test("check-out rejeita pedidos abertos e registra PEDIDOS_ABERTOS", async (t) => {
    const ctx = await ambiente(t, { status: "CHECK_IN", orders: [{ id_pedido: 1, id_reserva: 9, status_pedido: "CONFIRMADO" }] });
    const resposta = await ctx.requisitar("/9/concluir");
    assert.equal(resposta.status, 409);
    assert.equal((await resposta.json()).error.includes("pedidos"), true);
    assert.equal(ctx.banco.auditorias.at(-1).resultado, "PEDIDOS_ABERTOS");
    assert.equal(ctx.banco.reserva.status_reserva, "CHECK_IN");
});

test("check-out rejeita reserva sem check-in e registra STATUS_INVALIDO", async (t) => {
    const ctx = await ambiente(t, { status: "CONFIRMADA" });
    assert.equal((await ctx.requisitar("/9/concluir")).status, 409);
    assert.equal(ctx.banco.auditorias.at(-1).resultado, "STATUS_INVALIDO");
});

test("check-out concluído aceita pedidos entregues ou cancelados e notifica", async (t) => {
    const ctx = await ambiente(t, {
        status: "CHECK_IN",
        orders: [
            { id_pedido: 1, id_reserva: 9, status_pedido: "ENTREGUE" },
            { id_pedido: 2, id_reserva: 9, status_pedido: "CANCELADO" },
        ],
    });
    const resposta = await ctx.requisitar("/9/concluir");
    assert.equal(resposta.status, 200);
    assert.equal(ctx.banco.reserva.status_reserva, "CONCLUIDA");
    assert.equal(ctx.banco.auditorias.at(-1).codigo_tecnico, "CHECK_OUT_RECORDED");
    assert.equal(ctx.banco.notifications.length, 2);
});

test("check-out repetido é idempotente e não duplica notificações", async (t) => {
    const ctx = await ambiente(t, { status: "CONCLUIDA" });
    const resposta = await ctx.requisitar("/9/concluir");
    assert.equal(resposta.status, 200);
    assert.equal(ctx.banco.notifications.length, 0);
    assert.equal(ctx.banco.auditorias.at(-1).codigo_tecnico, "ALREADY_COMPLETED");
});

test("duas tentativas simultâneas de check-in só permitem uma transição", async (t) => {
    const ctx = await ambiente(t, { updateDelayMs: 10 });
    const respostas = await Promise.all([
        ctx.requisitar("/9/check-in"),
        ctx.requisitar("/9/check-in"),
    ]);
    assert.deepEqual(respostas.map((resposta) => resposta.status).sort(), [200, 409]);
    assert.equal(ctx.banco.updateAttempts, 2);
    assert.equal(ctx.banco.notifications.length, 2);
    assert.equal(ctx.banco.auditorias.filter((item) => item.codigo_tecnico === "CHECK_IN_RECORDED").length, 1);
    assert.equal(ctx.banco.auditorias.filter((item) => item.codigo_tecnico === "CHECK_IN_CONCURRENCY_CONFLICT").length, 1);
});

test("duas tentativas simultâneas de check-out só permitem uma transição", async (t) => {
    const ctx = await ambiente(t, { status: "CHECK_IN", updateDelayMs: 10 });
    const respostas = await Promise.all([
        ctx.requisitar("/9/concluir"),
        ctx.requisitar("/9/concluir"),
    ]);
    assert.deepEqual(respostas.map((resposta) => resposta.status).sort(), [200, 409]);
    assert.equal(ctx.banco.notifications.length, 2);
    assert.equal(ctx.banco.auditorias.filter((item) => item.codigo_tecnico === "CHECK_OUT_RECORDED").length, 1);
    assert.equal(ctx.banco.auditorias.filter((item) => item.codigo_tecnico === "CHECK_OUT_CONCURRENCY_CONFLICT").length, 1);
});

test("rate limit bloqueia a nona tentativa para a mesma reserva", async (t) => {
    const ctx = await ambiente(t);
    const respostas = [];
    for (let tentativa = 0; tentativa < 9; tentativa += 1) {
        respostas.push(await ctx.requisitar("/9/check-in", { codigo: "0000" }));
    }
    assert.equal(respostas.slice(0, 8).every((resposta) => resposta.status === 422), true);
    assert.equal(respostas[8].status, 429);
    assert.equal((await respostas[8].json()).code, "RATE_LIMITED");
    assert.ok(respostas[8].headers.get("retry-after"));
});

test("reservas diferentes possuem limites independentes", async (t) => {
    const ctx = await ambiente(t);
    for (let tentativa = 0; tentativa < 8; tentativa += 1) {
        assert.equal((await ctx.requisitar("/9/check-in", { codigo: "0000" })).status, 422);
    }
    ctx.banco.reserva.id_reserva = 10;
    assert.equal((await ctx.requisitar("/10/check-in", { codigo: "0000" })).status, 422);
});
