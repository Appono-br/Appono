"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
    validarCompatibilidadeRelatorio,
    validarManifestoExperimento,
} = require("../src/domain/routine-experiment-manifest");

const raiz = path.resolve(__dirname, "..");
const manifesto = JSON.parse(fs.readFileSync(path.join(raiz, "experiments/routine-intelligence/manifest.json"), "utf8"));

function sha256(arquivo) {
    return crypto.createHash("sha256").update(fs.readFileSync(arquivo)).digest("hex");
}

test("manifesto experimental congela modelos, conjuntos e rollout zero", () => {
    assert.equal(validarManifestoExperimento(manifesto), manifesto);
    assert.equal(manifesto.models.control, "deterministico-v3");
    assert.deepEqual(manifesto.models.challengers, ["appono-intelligence-v1", "appono-intelligence-v2"]);
    assert.equal(manifesto.datasets.reserva.status, "OPENED_ONCE");
});

test("relatorios congelados permanecem compativeis com o manifesto", () => {
    for (const nome of ["desenvolvimento", "validacao", "reserva"]) {
        const relatorio = JSON.parse(fs.readFileSync(path.join(raiz, `reports/routine-intelligence/${nome}.json`), "utf8"));
        assert.equal(validarCompatibilidadeRelatorio(manifesto, relatorio), relatorio);
    }
});

test("hashes congelados identificam o codigo e os artefatos avaliados", () => {
    for (const [arquivo, hash] of Object.entries(manifesto.source_files)) {
        assert.equal(sha256(path.resolve(raiz, "..", arquivo)), hash, arquivo);
    }
    for (const conjunto of Object.values(manifesto.datasets)) {
        assert.equal(sha256(path.resolve(raiz, "..", conjunto.report)), conjunto.report_sha256, conjunto.report);
    }
    assert.equal(
        sha256(path.resolve(raiz, "..", manifesto.artifacts.blind_review.path)),
        manifesto.artifacts.blind_review.sha256,
    );
});

test("comparacao falha claramente quando semente ou catalogo mudam", () => {
    const relatorio = JSON.parse(fs.readFileSync(path.join(raiz, "reports/routine-intelligence/validacao.json"), "utf8"));
    assert.throws(
        () => validarCompatibilidadeRelatorio(manifesto, { ...relatorio, semente: relatorio.semente + 1 }),
        /MANIFESTO_EXPERIMENTO_INVALIDO: relatorio incompativel \(semente:/,
    );
    assert.throws(
        () => validarCompatibilidadeRelatorio(manifesto, { ...relatorio, hash_catalogo: "0".repeat(64) }),
        /hash_catalogo/,
    );
});
