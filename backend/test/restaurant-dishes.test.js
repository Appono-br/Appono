"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const codigoRota = fs.readFileSync(path.join(__dirname, "../src/routes/restaurants.js"), "utf8");
const restaurante = { id_restaurante: 1, nome: "Cantina Central", endereco: "Rua das Flores", ativo: true };
const categoria = { nome: "Massas", descricao: "Artesanais", ativo: true, arquivado: false, cardapios: { nome: "Almoço", ativo: true } };
const prato = { id_produto: 11, id_restaurante: 1, nome: "Lasanha", descricao: "Molho de tomate", preco: "39.90", imagem_url: "https://example.com/lasanha.jpg", disponivel: true, arquivado: false, categorias: categoria };

async function listar(query = {}, produtos = [prato], erroProdutos = null) {
    let handler;
    const banco = {
        from(tabela) {
            let dados = tabela === "restaurantes" ? [restaurante, { id_restaurante: 2, nome: "Fechado", ativo: false }] : produtos;
            return {
                select() { return this; },
                eq(campo, valor) { dados = dados.filter((item) => item[campo] === valor); return this; },
                order() { return this; },
                then(resolve, reject) { return Promise.resolve({ data: dados, error: tabela === "produtos" ? erroProdutos : null }).then(resolve, reject); },
            };
        },
    };
    const router = {
        get(rota, ...handlers) { if (rota === "/") handler = handlers.at(-1); },
        patch() {},
        post() {},
    };
    vm.runInNewContext(codigoRota, {
        exports: {},
        require(nome) {
            if (nome === "express") return { Router: () => router };
            if (nome === "../lib/supabase") return { supabaseAdmin: null, supabaseAuth: banco };
            if (nome === "../middleware/auth") return { requireRole: () => () => {}, requireAuth() {} };
            if (nome === "../services/geolocalizacao") return { coordenadaValida: () => false };
            throw new Error(`Dependência inesperada: ${nome}`);
        },
    });
    const resposta = { statusCode: 200, status(valor) { this.statusCode = valor; return this; }, json(dados) { this.body = JSON.parse(JSON.stringify(dados)); return this; } };
    await handler({ query, headers: {} }, resposta);
    return resposta;
}

test("lista pratos com foto, preço numérico e restaurante correto, sem alterar chamadas existentes", async () => {
    const comPratos = await listar({ incluir_pratos: "1" });
    assert.equal(comPratos.statusCode, 200);
    assert.deepEqual(comPratos.body[0].pratos_publicados, [{ id_produto: 11, nome: "Lasanha", preco: 39.9, imagem_url: prato.imagem_url }]);
    const semPratos = await listar();
    assert.equal(Object.hasOwn(semPratos.body[0], "pratos_publicados"), false);
});

test("não exibe pratos indisponíveis, arquivados, sem preço ou de cardápios inativos", async () => {
    const produtos = [
        prato,
        { ...prato, id_produto: 12, disponivel: false },
        { ...prato, id_produto: 13, arquivado: true },
        { ...prato, id_produto: 14, categorias: { ...categoria, ativo: false } },
        { ...prato, id_produto: 15, categorias: { ...categoria, arquivado: true } },
        { ...prato, id_produto: 16, categorias: { ...categoria, cardapios: { ativo: false } } },
        { ...prato, id_produto: 17, categorias: null },
        { ...prato, id_produto: 18, preco: null },
        { ...prato, id_produto: 19, preco: "inválido" },
        { ...prato, id_produto: 20, id_restaurante: 2 },
    ];
    const resposta = await listar({ incluir_pratos: "1" }, produtos);
    assert.equal(resposta.body.length, 1);
    assert.deepEqual(resposta.body[0].pratos_publicados.map((item) => item.id_produto), [11]);
});

test("busca por prato e categoria retorna só os pratos correspondentes", async () => {
    const produtos = [prato, { ...prato, id_produto: 12, nome: "Suco", descricao: "Laranja", categorias: { ...categoria, nome: "Bebidas" } }];
    for (const q of ["lasanha", "massas", "LASANHA TOMATE"]) {
        const resposta = await listar({ incluir_pratos: "1", q }, produtos);
        assert.deepEqual(resposta.body[0].pratos_publicados.map((item) => item.nome), ["Lasanha"]);
    }
    assert.deepEqual((await listar({ incluir_pratos: "1", q: "sushi" }, produtos)).body, []);
});

test("busca pelo restaurante ou endereço inclui seus pratos, inclusive sem foto", async () => {
    const produtos = [prato, { ...prato, id_produto: 12, imagem_url: null }];
    for (const q of ["cantina", "flores", "almoco"]) {
        const resposta = await listar({ incluir_pratos: "1", q }, produtos);
        assert.equal(resposta.body[0].pratos_publicados.length, 2);
        assert.equal(resposta.body[0].pratos_publicados[1].imagem_url, null);
    }
});

test("falha ao consultar pratos retorna erro em vez de uma vitrine vazia silenciosa", async () => {
    const resposta = await listar({ incluir_pratos: "1" }, [], { message: "Banco indisponível" });
    assert.equal(resposta.statusCode, 400);
    assert.match(resposta.body.error, /pratos/);
});
