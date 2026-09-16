"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    criarEstadoOAuth,
    criarPkce,
    extrairIntervalosGoogle,
    extrairIntervalosOutlook,
    hashSeguro,
    normalizarIntervalos,
    normalizarProvedor,
} = require("../src/domain/routine-calendar");
const { cifrar, decifrar } = require("../src/services/agenda/crypto");

test("PKCE e state usam entropia e formatos seguros", () => {
    const primeiro = criarPkce();
    const segundo = criarPkce();
    assert.match(primeiro.verifier, /^[\w-]{43,128}$/);
    assert.match(primeiro.challenge, /^[\w-]{43}$/);
    assert.notEqual(primeiro.verifier, segundo.verifier);
    assert.notEqual(criarEstadoOAuth(), criarEstadoOAuth());
    assert.equal(hashSeguro("state").length, 64);
});

test("cifragem autenticada protege e detecta adulteração", () => {
    const chave = Buffer.alloc(32, 7).toString("base64");
    const protegido = cifrar("refresh-token", chave);
    assert.notEqual(protegido, "refresh-token");
    assert.equal(decifrar(protegido, chave), "refresh-token");
    const partes = protegido.split(".");
    partes[2] = `${partes[2].startsWith("A") ? "B" : "A"}${partes[2].slice(1)}`;
    const adulterado = partes.join(".");
    assert.throws(() => decifrar(adulterado, chave));
});

test("intervalos sobrepostos são recortados, unidos e ordenados", () => {
    const janelas = normalizarIntervalos([
        { start: "2026-09-14T13:00:00Z", end: "2026-09-14T14:00:00Z" },
        { start: "2026-09-14T12:30:00Z", end: "2026-09-14T13:15:00Z" },
        { start: "2026-09-13T22:00:00Z", end: "2026-09-14T12:15:00Z" },
        { start: "inválido", end: "2026-09-14T13:00:00Z" },
    ], { inicioPeriodo: "2026-09-14T12:00:00Z", fimPeriodo: "2026-09-14T15:00:00Z" });
    assert.equal(janelas.length, 2);
    assert.deepEqual(janelas.map(({ inicio_em, fim_em }) => [inicio_em, fim_em]), [
        ["2026-09-14T12:00:00.000Z", "2026-09-14T12:15:00.000Z"],
        ["2026-09-14T12:30:00.000Z", "2026-09-14T14:00:00.000Z"],
    ]);
    assert.ok(janelas.every((item) => item.origem_hash.length === 64));
});

test("extrai somente ocupação mínima dos provedores", () => {
    assert.deepEqual(extrairIntervalosGoogle({ calendars: { primary: { busy: [{ start: "a", end: "b" }] } } }), [{ start: "a", end: "b" }]);
    assert.deepEqual(extrairIntervalosOutlook({ value: [{ scheduleItems: [
        { status: "free", start: { dateTime: "a" }, end: { dateTime: "b" } },
        { status: "busy", start: { dateTime: "c" }, end: { dateTime: "d" } },
    ] }] }), [{ start: "c", end: "d" }]);
    assert.equal(normalizarProvedor("google"), "GOOGLE");
    assert.equal(normalizarProvedor("qualquer"), null);
});
