"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { flagAtiva, validarPeriodoMetricas } = require("../src/domain/routine-insights");

test("metricas de demanda aceitam somente janelas curtas e datas reais", () => {
    assert.deepEqual(validarPeriodoMetricas("2026-09-01", "2026-11-30"), { inicio: "2026-09-01", fim: "2026-11-30" });
    assert.throws(() => validarPeriodoMetricas("2026-09-01", "2026-12-01"), /90 dias/);
    assert.throws(() => validarPeriodoMetricas("2026-02-30", "2026-03-01"), /período válido/);
    assert.equal(flagAtiva("true"), true);
    assert.equal(flagAtiva("false"), false);
});
