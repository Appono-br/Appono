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
const { criarUrlAutorizacao, podeEscreverGoogle } = require("../src/services/agenda/providers");
const { hashEvento, idEventoGoogle, montarEventoGoogle } = require("../src/services/agenda/planning-events");

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

test("reconhece apenas escopos que permitem gravar eventos no Google", () => {
    assert.equal(podeEscreverGoogle(["https://www.googleapis.com/auth/calendar.events.freebusy"]), false);
    assert.equal(podeEscreverGoogle(["https://www.googleapis.com/auth/calendar.events.owned"]), true);
});

test("reconexão Google solicita autorização incremental e acesso offline", () => {
    const anterior = {
        enabled: process.env.APPONO_ROTINA_AGENDA_GOOGLE_ENABLED,
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI,
    };
    process.env.APPONO_ROTINA_AGENDA_GOOGLE_ENABLED = "true";
    process.env.GOOGLE_CALENDAR_CLIENT_ID = "client-id";
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "client-secret";
    process.env.GOOGLE_CALENDAR_REDIRECT_URI = "https://api.example.com/api/rotina/agenda/google/callback";
    try {
        const url = new URL(criarUrlAutorizacao("GOOGLE", { state: "state", challenge: "challenge" }));
        assert.equal(url.searchParams.get("access_type"), "offline");
        assert.equal(url.searchParams.get("include_granted_scopes"), "true");
        assert.equal(url.searchParams.get("prompt"), "consent");
        assert.match(url.searchParams.get("scope"), /calendar\.events\.owned/);
    } finally {
        if (anterior.enabled === undefined) delete process.env.APPONO_ROTINA_AGENDA_GOOGLE_ENABLED;
        else process.env.APPONO_ROTINA_AGENDA_GOOGLE_ENABLED = anterior.enabled;
        if (anterior.clientId === undefined) delete process.env.GOOGLE_CALENDAR_CLIENT_ID;
        else process.env.GOOGLE_CALENDAR_CLIENT_ID = anterior.clientId;
        if (anterior.clientSecret === undefined) delete process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
        else process.env.GOOGLE_CALENDAR_CLIENT_SECRET = anterior.clientSecret;
        if (anterior.redirectUri === undefined) delete process.env.GOOGLE_CALENDAR_REDIRECT_URI;
        else process.env.GOOGLE_CALENDAR_REDIRECT_URI = anterior.redirectUri;
    }
});

test("monta evento privado e idempotente para a refeição planejada", () => {
    const refeicao = {
        id_refeicao_planejada: 42,
        id_planejamento_rotina: 9,
        data_refeicao: "2026-09-21",
        horario_sugerido: "23:30:00",
        restaurantes: { nome: "Restaurante Teste", endereco: "Rua Um, 10" },
        produtos: { nome: "Prato do dia" },
        janelas_alimentacao_rotina: { nome: "Jantar", tempo_maximo_minutos: 60 },
    };
    const evento = montarEventoGoogle(refeicao, "https://appono.example");
    assert.equal(evento.summary, "Appono Rotina: Restaurante Teste");
    assert.equal(evento.visibility, "private");
    assert.equal(evento.start.dateTime, "2026-09-21T23:30:00");
    assert.equal(evento.end.dateTime, "2026-09-22T00:30:00");
    assert.equal(evento.extendedProperties.private.appono_refeicao_id, "42");
    assert.match(idEventoGoogle(7, 42), /^appono[0-9a-f]{64}$/);
    assert.equal(hashEvento(evento), hashEvento(montarEventoGoogle(refeicao, "https://appono.example")));
});
