"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
    avaliarUtilidadePersona,
    hashCanonico,
    reagirPersona,
    serializarCanonico,
    validarArtefatoPersonas,
    validarPersona,
    verificarCasoEsperado,
} = require("../src/domain/routine-intelligence-personas");

const arquivo = path.resolve(__dirname, "../experiments/routine-intelligence/personas-v1.json");
const artefato = JSON.parse(fs.readFileSync(arquivo, "utf8"));
const porId = new Map(artefato.personas.map((persona) => [persona.id, persona]));
const candidato = { id_restaurante: "r", id_produto: "p", categoria: "Brasileira", preco: 30, distancia: 2 };

test("artefato versiona dez personas distintas e sem referencias aos modelos", () => {
    assert.equal(validarArtefatoPersonas(artefato), artefato);
    assert.equal(artefato.personas.length, 10);
    assert.equal(new Set(artefato.personas.map((persona) => persona.id)).size, 10);
    assert.deepEqual([...porId.keys()], [
        "economico", "explorador", "fiel_restaurante", "fiel_prato", "sensivel_distancia",
        "avesso_repeticao", "preferencia_forte", "contraditorio", "mudanca_gradual", "controle_sem_historico",
    ]);
    const fonte = fs.readFileSync(arquivo, "utf8");
    assert.doesNotMatch(fonte, /deterministico-v3|appono-intelligence-v1|appono-intelligence-v2/i);
});

test("trinta casos esperados independentes passam", () => {
    let total = 0;
    for (const persona of artefato.personas) {
        assert.ok(persona.casos_esperados.length >= 3, persona.id);
        for (const caso of persona.casos_esperados) {
            const resultado = verificarCasoEsperado(persona, caso);
            assert.equal(resultado.passou, true, `${persona.id}/${caso.id}: ${resultado.observado}`);
            total += 1;
        }
    }
    assert.equal(total, 30);
});

test("utilidade e deterministica, finita e igual a soma das contribuicoes", () => {
    const persona = porId.get("economico");
    const contexto = { semana: 1, indice: 2, semente: 99, historico: [] };
    const primeira = avaliarUtilidadePersona(persona, candidato, contexto);
    const segunda = avaliarUtilidadePersona(persona, candidato, contexto);
    assert.deepEqual(primeira, segunda);
    const soma = Object.values(primeira.contribuicoes).reduce((total, valor) => total + valor, 0);
    assert.ok(Number.isFinite(primeira.utilidade));
    assert.ok(Math.abs(primeira.utilidade - soma) < 0.000001);
});

test("orcamento e raio tornam candidato inelegivel antes da utilidade", () => {
    const persona = porId.get("economico");
    assert.deepEqual(avaliarUtilidadePersona(persona, { ...candidato, preco: 33 }), {
        elegivel: false, motivo: "FORA_ORCAMENTO", utilidade: null, contribuicoes: {},
    });
    assert.deepEqual(avaliarUtilidadePersona(persona, { ...candidato, distancia: 8 }), {
        elegivel: false, motivo: "FORA_RAIO", utilidade: null, contribuicoes: {},
    });
});

test("penalidade de repeticao cresce e satura antes de anular aversao", () => {
    const persona = porId.get("avesso_repeticao");
    const uma = [{ id_restaurante: "r", id_produto: "p", categoria: "Massas" }];
    const tres = [...uma, ...uma, ...uma];
    const primeira = avaliarUtilidadePersona(persona, { ...candidato, categoria: "Massas" }, { historico: uma, aplicar_ruido: false });
    const terceira = avaliarUtilidadePersona(persona, { ...candidato, categoria: "Massas" }, { historico: tres, aplicar_ruido: false });
    const evitada = avaliarUtilidadePersona(persona, { ...candidato, id_restaurante: "novo", id_produto: "novo", categoria: "Doces" }, { historico: tres, aplicar_ruido: false });
    assert.ok(terceira.utilidade < primeira.utilidade);
    assert.ok(primeira.utilidade > evitada.utilidade);
});

test("sinais contraditorios se compensam e ruido repete com a mesma semente", () => {
    const persona = porId.get("contraditorio");
    const contexto = {
        semana: 2,
        indice: 4,
        semente: 123,
        historico: [],
        sinais: [{ categoria: "Lanches", valor: 2 }, { categoria: "Lanches", valor: -2 }],
    };
    const opcao = { ...candidato, categoria: "Lanches" };
    const primeira = avaliarUtilidadePersona(persona, opcao, contexto);
    const segunda = avaliarUtilidadePersona(persona, opcao, contexto);
    assert.equal(primeira.contribuicoes.comportamental, 0);
    assert.deepEqual(primeira, segunda);
});

test("mudanca de gosto ocorre de forma gradual", () => {
    const persona = porId.get("mudanca_gradual");
    const massas = { ...candidato, categoria: "Massas" };
    const asiatica = { ...candidato, id_produto: "p2", categoria: "Asiatica" };
    const diferenca = (semana) => avaliarUtilidadePersona(persona, massas, { semana, aplicar_ruido: false }).utilidade
        - avaliarUtilidadePersona(persona, asiatica, { semana, aplicar_ruido: false }).utilidade;
    assert.ok(diferenca(0) > diferenca(3));
    assert.ok(diferenca(3) > diferenca(5));
    assert.ok(diferenca(0) > 0);
    assert.ok(diferenca(5) < 0);
});

test("controle sem historico avalia utilidade mas nao gera sinal", () => {
    const persona = porId.get("controle_sem_historico");
    assert.equal(avaliarUtilidadePersona(persona, candidato).elegivel, true);
    assert.equal(reagirPersona(persona, { utilidade: 5, melhor_utilidade: 5, chave: "caso" }), null);
});

test("reacao sintetica e idempotente, local e nao persistivel", () => {
    const persona = porId.get("economico");
    const primeira = reagirPersona(persona, { utilidade: 8, melhor_utilidade: 8, chave: "semana-1-dia-1" });
    const segunda = reagirPersona(persona, { utilidade: 8, melhor_utilidade: 8, chave: "semana-1-dia-1" });
    assert.deepEqual(primeira, segunda);
    assert.equal(primeira.tipo, "CONVERSAO_SIMULADA");
    assert.equal(primeira.sintetico, true);
    assert.equal(primeira.persistir, false);
    assert.match(primeira.chave_idempotencia, /^offline:/);
});

test("hash canonico e estavel e detecta alteracao", () => {
    const invertido = { ...artefato, personas: [...artefato.personas].reverse() };
    assert.equal(hashCanonico(artefato), hashCanonico(JSON.parse(JSON.stringify(artefato))));
    assert.notEqual(hashCanonico(artefato), hashCanonico(invertido));
    assert.equal(serializarCanonico({ b: 2, a: 1 }), serializarCanonico({ a: 1, b: 2 }));
});

test("validator rejeita campo desconhecido, conflito e limiar contraditorio", () => {
    const base = porId.get("economico");
    assert.throws(() => validarPersona({ ...base, typo: true }), /campo desconhecido/);
    assert.throws(() => validarPersona({
        ...base,
        aversoes: { ...base.aversoes, categorias: ["Brasileira"] },
    }), /afinidade e aversao/);
    assert.throws(() => validarPersona({
        ...base,
        politica_decisao: { ...base.politica_decisao, aprovar_min: 1 },
    }), /limiares contraditorios/);
});

test("artefato nao contem campos pessoais ou medicos", () => {
    const texto = JSON.stringify(artefato);
    assert.doesNotMatch(texto, /email|telefone|endereco|latitude|longitude|alergia|token|jwt|service_role/i);
});

test("dominio de personas nao importa modelos, banco, HTTP ou pagamentos", () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, "../src/domain/routine-intelligence-personas.js"), "utf8");
    assert.doesNotMatch(fonte, /require\([^)]*(routine-scoring|routine-intelligence-v2|supabase|express|mercadopago)/i);
    assert.doesNotMatch(fonte, /fetch\(|\.from\(|pagamento|reserva/i);
});
