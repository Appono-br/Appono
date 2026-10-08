"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { PostgrestClient } = require("@supabase/postgrest-js");
const pagination = require("../src/domain/pagination");

const codigo = fs.readFileSync(path.join(__dirname, "../src/routes/orders.js"), "utf8");
const pedido = (id, dataReserva, extra = {}) => ({
    id_pedido: id,
    data_pedido: "2026-10-01T12:00:00Z",
    ocultado_cliente: false,
    reservas: dataReserva ? { data_reserva: dataReserva, horario_inicio: "12:00:00", status_reserva: "CONFIRMADA" } : null,
    ...extra,
});
const pedidos = [
    ...Array.from({ length: 20 }, (_, index) => pedido(200 + index, "2026-10-20", { data_pedido: "2026-10-09T12:00:00Z" })),
    ...Array.from({ length: 13 }, (_, index) => pedido(100 + index, "2026-10-14")),
    pedido(150, "2026-10-15"),
    pedido(151, "2026-10-14", { ocultado_cliente: true }),
    pedido(300, null),
];

async function listar(query = {}, erroBanco = null) {
    const chamadas = [];
    const tokens = [];
    let handler;
    const banco = new PostgrestClient("https://agenda.example.test/rest/v1", {
        headers: { Authorization: "Bearer token-cliente" },
        fetch: async (input, init) => {
            const url = new URL(input);
            chamadas.push({ url, headers: new Headers(init.headers) });
            if (erroBanco) return new Response(JSON.stringify({ message: erroBanco }), { status: 400 });
            let dados = pedidos.filter((item) => item.ocultado_cliente === false);
            const data = url.searchParams.get("reservas.data_reserva")?.replace(/^eq\./, "");
            if (data) {
                // Uma relação externa filtra só o objeto vinculado; !inner filtra também os pedidos.
                dados = url.searchParams.get("select").includes("reservas!inner(")
                    ? dados.filter((item) => item.reservas?.data_reserva === data)
                    : dados.map((item) => ({ ...item, reservas: item.reservas?.data_reserva === data ? item.reservas : null }));
            }
            dados = [...dados].sort((a, b) => b.data_pedido.localeCompare(a.data_pedido));
            const total = dados.length;
            const inicio = Number(url.searchParams.get("offset") ?? 0);
            const limite = Number(url.searchParams.get("limit") ?? total);
            dados = dados.slice(inicio, inicio + limite);
            return new Response(JSON.stringify(dados), {
                status: 200,
                headers: { "Content-Type": "application/json", "Content-Range": `${inicio}-${inicio + dados.length - 1}/${total}` },
            });
        },
    });
    const router = {
        use() {},
        get(rota, ...handlers) { if (rota === "/") handler = handlers.at(-1); },
        post() {},
        patch() {},
    };
    vm.runInNewContext(codigo, {
        exports: {},
        require(nome) {
            if (nome === "express") return { Router: () => router };
            if (nome === "../lib/supabase") return { createUserSupabaseClient: (token) => { tokens.push(token); return banco; } };
            if (nome === "../middleware/auth") return { requireAuth() {}, requireRole: () => () => {} };
            if (nome === "../domain/pagination") return pagination;
            return {};
        },
    });
    const resposta = {
        locals: { accessToken: "token-cliente" },
        statusCode: 200,
        status(valor) { this.statusCode = valor; return this; },
        json(valor) { this.body = JSON.parse(JSON.stringify(valor)); return this; },
    };
    await handler({ query }, resposta);
    return { ...resposta, chamadas, tokens };
}

test("agenda filtra pela data da reserva antes de paginar e contar pedidos", async () => {
    const resposta = await listar({ data: "2026-10-14", page: "1", limit: "12" });
    assert.equal(resposta.statusCode, 200);
    assert.equal(resposta.body.items.length, 12);
    assert.ok(resposta.body.items.every((item) => item.reservas.data_reserva === "2026-10-14"));
    assert.ok(resposta.body.items.every((item) => item.data_pedido.startsWith("2026-10-01")));
    assert.deepEqual(resposta.body.pagination, { page: 1, limit: 12, total: 13, totalPages: 2 });
    assert.deepEqual(resposta.tokens, ["token-cliente"]);
    assert.equal(resposta.chamadas[0].headers.get("Authorization"), "Bearer token-cliente");
});

test("segunda página contém os pedidos restantes do mesmo dia", async () => {
    const resposta = await listar({ data: "2026-10-14", page: "2", limit: "12" });
    assert.deepEqual(resposta.body.items.map((item) => item.id_pedido), [112]);
    assert.deepEqual(resposta.body.pagination, { page: 2, limit: 12, total: 13, totalPages: 2 });
});

test("dias diferentes retornam apenas seus pedidos ou uma lista vazia", async () => {
    const dia15 = await listar({ data: "2026-10-15" });
    assert.deepEqual(dia15.body.items.map((item) => item.id_pedido), [150]);
    assert.equal(dia15.body.pagination.total, 1);
    const dia10 = await listar({ data: "2026-10-10" });
    assert.deepEqual(dia10.body.items, []);
    assert.deepEqual(dia10.body.pagination, { page: 1, limit: 12, total: 0, totalPages: 0 });
});

test("consulta sem data mantém o histórico completo e exclui pedidos ocultados", async () => {
    const resposta = await listar({ limit: "50" });
    assert.equal(resposta.body.items.length, 35);
    assert.ok(resposta.body.items.some((item) => item.id_pedido === 300));
    assert.ok(resposta.body.items.every((item) => !item.ocultado_cliente));
    assert.equal(resposta.chamadas[0].url.searchParams.has("reservas.data_reserva"), false);
});

test("datas inválidas são rejeitadas antes de acessar o banco", async () => {
    for (const data of ["", "14/10/2026", "2026-02-30", "2026-13-01", "2026-10-00", ["2026-10-14"], null]) {
        const resposta = await listar({ data });
        assert.equal(resposta.statusCode, 400, JSON.stringify(data));
        assert.match(resposta.body.error, /Data inválida/);
        assert.equal(resposta.chamadas.length, 0);
    }
});

test("falha na consulta dos pedidos retorna erro", async () => {
    const resposta = await listar({ data: "2026-10-14" }, "Consulta indisponível");
    assert.equal(resposta.statusCode, 400);
    assert.equal(resposta.body.error, "Consulta indisponível");
});
