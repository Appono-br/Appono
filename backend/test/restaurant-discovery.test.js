"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { coordenadaValida } = require("../src/services/geolocalizacao");
const codigo = fs.readFileSync(path.join(__dirname, "../src/routes/restaurants.js"), "utf8");
const latitudeEmKm = (km) => km / 6371 * 180 / Math.PI;
const restaurante = (id, categorias, km, extra = {}) => ({
    id_restaurante: id, nome: `Restaurante ${id}`, ativo: true,
    categorias_culinarias: categorias, latitude: km === null ? null : latitudeEmKm(km),
    longitude: km === null ? null : 0, configuracao_operacao: {}, ...extra,
});

async function requisicao(query = {}, opcoes = {}) {
    const tabelas = {
        restaurantes: opcoes.restaurantes ?? [restaurante(1, ["Japonesa", "Contemporânea"], 2), restaurante(2, ["Italiana"], 3)],
        produtos: opcoes.produtos ?? [],
        avaliacoes_restaurante: opcoes.avaliacoes ?? [],
        restaurantes_favoritos: opcoes.favoritos ?? [],
        chamados_suporte: [], clientes: [],
    };
    const chamadas = [];
    const geocodificados = [];
    const handlers = new Map();
    const banco = {
        rpc(nome) {
            chamadas.push({ rpc: nome });
            return Promise.resolve({ data: opcoes.categorias ?? [], error: opcoes.erroRpc ?? null });
        },
        from(tabela) {
            let dados = tabelas[tabela] ?? [];
            let inicio = 0, fim = 999;
            let atualizacao = null;
            const consulta = {
                select(campos) { chamadas.push({ tabela, campos }); return this; },
                eq(campo, valor) { dados = dados.filter((item) => item[campo] === valor); return this; },
                in(campo, valores) { dados = dados.filter((item) => valores.includes(item[campo])); return this; },
                contains(campo, valores) {
                    chamadas.push({ tabela, contains: campo, valores: [...valores] });
                    dados = dados.filter((item) => valores.every((valor) => item[campo]?.includes(valor)));
                    return this;
                },
                order(campo) { dados = [...dados].sort((a, b) => String(a[campo]).localeCompare(String(b[campo]))); return this; },
                range(de, ate) { inicio = de; fim = ate; chamadas.push({ tabela, range: [de, ate] }); return this; },
                update(valor) { atualizacao = valor; return this; },
                then(resolve, reject) {
                    if (atualizacao) dados.forEach((item) => Object.assign(item, atualizacao));
                    return Promise.resolve({ data: dados.slice(inicio, fim + 1), error: opcoes.erros?.[tabela] ?? null }).then(resolve, reject);
                },
            };
            return consulta;
        },
    };
    const router = { get(rota, ...lista) { handlers.set(rota, lista.at(-1)); }, patch() {}, post() {} };
    vm.runInNewContext(codigo, {
        exports: {},
        require(nome) {
            if (nome === "express") return { Router: () => router };
            if (nome === "../lib/supabase") return { supabaseAdmin: banco, supabaseAuth: banco };
            if (nome === "../middleware/auth") return { requireRole: () => () => {}, requireAuth() {} };
            if (nome === "../services/geolocalizacao") return {
                coordenadaValida,
                async geocodificarEnderecoRestaurante(item) { geocodificados.push(item.id_restaurante); return opcoes.coordenadasGeocodificadas ?? null; },
            };
            throw new Error(`Dependência inesperada: ${nome}`);
        },
    });
    const res = { statusCode: 200, status(valor) { this.statusCode = valor; return this; }, json(data) { this.body = JSON.parse(JSON.stringify(data)); return this; } };
    await handlers.get(opcoes.rota ?? "/")({ query, headers: {} }, res);
    return { ...res, chamadas, geocodificados };
}

test("categorias retornam a agregação do banco, sem adicionar nomes ou preencher estado vazio", async () => {
    const categorias = [{ categoria: "Categoria existente", total_restaurantes: 3 }];
    const res = await requisicao({}, { rota: "/categorias", categorias });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, categorias);
    assert.deepEqual(res.chamadas, [{ rpc: "listar_categorias_restaurantes" }]);
    assert.deepEqual((await requisicao({}, { rota: "/categorias" })).body, []);
    const erro = await requisicao({}, { rota: "/categorias", erroRpc: { code: "PGRST202", message: "Função ausente" } });
    assert.equal(erro.statusCode, 503);
    assert.equal(erro.body.code, "CATEGORIAS_MIGRATION_PENDENTE");
    const erroConsulta = await requisicao({}, { rota: "/categorias", erroRpc: { code: "42501", message: "Permissão negada" } });
    assert.equal(erroConsulta.statusCode, 503);
    assert.equal(erroConsulta.body.code, "CATEGORIAS_CONSULTA_FALHOU");
});

test("categoria usa o perfil no banco, admite múltiplas escolhas e restaurantes sem pratos", async () => {
    const res = await requisicao({ categoria: "Japonesa" }, {
        restaurantes: [restaurante(1, ["Japonesa", "Contemporânea"], 2), restaurante(2, ["Italiana"], 3), restaurante(3, ["Japonesa"], 4, { ativo: false })],
        produtos: [{ id_restaurante: 2, nome: "Sushi", preco: 30, disponivel: true, arquivado: false, categorias: { nome: "Japonesa", ativo: true, cardapios: { ativo: true } } }],
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.map((item) => item.id_restaurante), [1]);
    assert.equal(res.body[0].tem_cardapio_publicado, false);
    assert.deepEqual(res.chamadas.find((item) => item.contains), { tabela: "restaurantes", contains: "categorias_culinarias", valores: ["Japonesa"] });
    assert.deepEqual((await requisicao({ categoria: "Inexistente" })).body, []);
});

test("combina categoria, raio de 20 km e ordenação por nota média ou favoritos reais", async () => {
    const opcoes = {
        restaurantes: [restaurante(1, ["Japonesa"], 2), restaurante(2, ["Japonesa"], 10), restaurante(3, ["Japonesa"], 25), restaurante(4, ["Italiana"], 1)],
        avaliacoes: [{ id_restaurante: 1, nota: 4 }, { id_restaurante: 2, nota: 5 }, { id_restaurante: 2, nota: 4 }, { id_restaurante: 3, nota: 5 }, { id_restaurante: 4, nota: 5 }],
        favoritos: [{ id_restaurante: 1 }, { id_restaurante: 1 }, { id_restaurante: 2 }],
    };
    const query = { categoria: "Japonesa", raio_km: "20", latitude: "0", longitude: "0" };
    const avaliados = await requisicao({ ...query, ordenacao: "avaliacao" }, opcoes);
    assert.equal(avaliados.statusCode, 200);
    assert.deepEqual(avaliados.body.map((item) => item.id_restaurante), [2, 1]);
    assert.equal(avaliados.body[0].avaliacao_media, 4.5);
    assert.equal(avaliados.body[0].total_avaliacoes, 2);
    const curtidos = await requisicao({ ...query, ordenacao: "curtidos" }, opcoes);
    assert.deepEqual(curtidos.body.map((item) => item.id_restaurante), [1, 2]);
    assert.equal(curtidos.body[0].total_favoritos, 2);
});

test("raio compara distância sem arredondar e exclui coordenadas ausentes ou inválidas", async () => {
    const res = await requisicao({ categoria: "Japonesa", raio_km: "20", latitude: "0", longitude: "0" }, {
        restaurantes: [restaurante(1, ["Japonesa"], 19.999), restaurante(2, ["Japonesa"], 20.04), restaurante(3, ["Japonesa"], null), restaurante(4, ["Japonesa"], 5, { latitude: 91 })],
    });
    assert.deepEqual(res.body.map((item) => item.id_restaurante), [1]);
    assert.deepEqual(res.geocodificados, [3, 4]);
    assert.ok(res.body[0].distancia_km <= 20);
});

test("reutiliza geocodificação do endereço para restaurante sem coordenadas", async () => {
    const res = await requisicao({ categoria: "Japonesa", raio_km: "20", latitude: "0", longitude: "0" }, {
        restaurantes: [restaurante(1, ["Japonesa"], null)], coordenadasGeocodificadas: { latitude: latitudeEmKm(3), longitude: 0 },
    });
    assert.deepEqual(res.geocodificados, [1]);
    assert.equal(res.body.length, 1);
    assert.ok(Math.abs(res.body[0].distancia_km - 3) < 0.001);
});

test("rejeita filtro de raio sem localização, fora do limite, coordenadas e ordenação inválidas", async () => {
    for (const query of [
        { raio_km: "20" }, { raio_km: "21", latitude: "0", longitude: "0" },
        { raio_km: "0" }, { raio_km: "abc" }, { raio_km: "-5" },
        { raio_km: "20", latitude: "91", longitude: "0" },
        { ordenacao: "distancia" }, { ordenacao: "inventada" }, { categoria: ["Japonesa", "Italiana"] },
    ]) assert.equal((await requisicao(query)).statusCode, 400, JSON.stringify(query));
});

test("ranking lê todas as páginas e falhas nas métricas não viram zeros fictícios", async () => {
    const favoritos = Array.from({ length: 1200 }, (_, indice) => ({ id_favorito: indice + 1, id_restaurante: indice < 600 ? 1 : 2 }));
    const avaliacoes = Array.from({ length: 1001 }, (_, indice) => ({ id_avaliacao: indice + 1, id_restaurante: 1, nota: indice < 1000 ? 4 : 5 }));
    const res = await requisicao({ ordenacao: "curtidos" }, { favoritos, avaliacoes });
    assert.equal(res.body.find((item) => item.id_restaurante === 2).total_favoritos, 600);
    assert.equal(res.body.find((item) => item.id_restaurante === 1).total_avaliacoes, 1001);
    assert.ok(res.chamadas.some((item) => item.tabela === "restaurantes_favoritos" && item.range?.[0] === 1000));
    for (const tabela of ["avaliacoes_restaurante", "restaurantes_favoritos"]) {
        const erro = await requisicao({ categoria: "Japonesa", ordenacao: "avaliacao" }, { erros: { [tabela]: { message: "Banco indisponível" } } });
        assert.equal(erro.statusCode, 400);
        assert.match(erro.body.error, /avaliações e favoritos/);
    }
});

test("ranking usa média exata antes de arredondar para exibição", async () => {
    const avaliacoes = [
        ...Array.from({ length: 100 }, (_, indice) => ({ id_restaurante: 1, nota: indice < 6 ? 4 : 5 })),
        ...Array.from({ length: 200 }, (_, indice) => ({ id_restaurante: 2, nota: indice < 18 ? 4 : 5 })),
    ];
    const res = await requisicao({ ordenacao: "avaliacao" }, { avaliacoes });
    assert.deepEqual(res.body.map((item) => item.id_restaurante), [1, 2]);
    assert.equal(res.body[0].avaliacao_media, 4.94);
    assert.equal(res.body[1].avaliacao_media, 4.91);
});
