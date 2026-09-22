"use strict";

const MANIFEST_SCHEMA_VERSION = 2;

function exigir(condicao, mensagem) {
    if (!condicao) throw new Error(`MANIFESTO_EXPERIMENTO_INVALIDO: ${mensagem}`);
}

function validarManifestoExperimento(manifesto) {
    exigir(manifesto && typeof manifesto === "object", "manifesto ausente");
    exigir(manifesto.schema_version === MANIFEST_SCHEMA_VERSION, `schema_version deve ser ${MANIFEST_SCHEMA_VERSION}`);
    exigir(typeof manifesto.protocol === "string" && manifesto.protocol.length > 0, "protocolo ausente");
    exigir(manifesto.models?.control === "deterministico-v3", "controle inesperado");
    exigir(Array.isArray(manifesto.models?.challengers) && manifesto.models.challengers.length === 2, "desafiantes invalidos");
    exigir(manifesto.independent_ruler === "persona-utility-v1", "regua independente inesperada");
    exigir(Number.isInteger(manifesto.weeks_per_persona) && manifesto.weeks_per_persona >= 6, "semanas por persona invalidas");
    exigir(manifesto.feature_flags?.public_rollout_percent === 0, "rollout publico deve permanecer zero");
    exigir(manifesto.feature_flags?.enabled_by_default === false, "feature flag deve iniciar desativada");

    for (const nome of ["desenvolvimento", "validacao", "reserva"]) {
        const conjunto = manifesto.datasets?.[nome];
        exigir(conjunto && typeof conjunto === "object", `conjunto ${nome} ausente`);
        exigir(Number.isInteger(conjunto.seed), `semente de ${nome} invalida`);
        exigir(typeof conjunto.reference_time === "string", `relogio de ${nome} ausente`);
        exigir(typeof conjunto.catalog_sha256 === "string" && conjunto.catalog_sha256.length === 64, `hash do catalogo de ${nome} invalido`);
        exigir(typeof conjunto.personas_sha256 === "string" && conjunto.personas_sha256.length === 64, `hash de personas de ${nome} invalido`);
        exigir(typeof conjunto.report_sha256 === "string" && conjunto.report_sha256.length === 64, `hash do relatorio de ${nome} invalido`);
    }
    exigir(manifesto.datasets.reserva.status === "OPENED_ONCE", "estado real da reserva deve permanecer registrado");
    return manifesto;
}

function validarCompatibilidadeRelatorio(manifesto, relatorio) {
    validarManifestoExperimento(manifesto);
    exigir(relatorio && typeof relatorio === "object", "relatorio ausente");
    const conjunto = manifesto.datasets[relatorio.conjunto];
    exigir(conjunto, `conjunto desconhecido: ${relatorio.conjunto ?? "ausente"}`);

    const divergencias = [];
    const comparar = (campo, recebido, esperado) => {
        if (recebido !== esperado) divergencias.push(`${campo}: recebido=${recebido} esperado=${esperado}`);
    };
    comparar("protocolo", relatorio.protocolo, manifesto.protocol);
    comparar("semente", relatorio.semente, conjunto.seed);
    comparar("referencia", relatorio.referencia, conjunto.reference_time);
    comparar("semanas", relatorio.semanas, manifesto.weeks_per_persona);
    comparar("hash_catalogo", relatorio.hash_catalogo, conjunto.catalog_sha256);
    comparar("hash_personas", relatorio.hash_personas, conjunto.personas_sha256);
    exigir(divergencias.length === 0, `relatorio incompativel (${divergencias.join("; ")})`);
    return relatorio;
}

module.exports = {
    MANIFEST_SCHEMA_VERSION,
    validarCompatibilidadeRelatorio,
    validarManifestoExperimento,
};
