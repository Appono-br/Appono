"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { decideV2_1, VERSION } = require("../src/domain/routine-intelligence-v2-1");

function candidate(id, category, price = 40) {
    return { candidate_id: id, restaurant: { id_restaurante: `r-${id}`, nome: `r-${id}` }, product: { id_produto: `p-${id}`, nome: `p-${id}`, categorias: { nome: category } }, preco_estimado: price, distancia_km: 2, avaliacao: 4.5, score_operacional: 0 };
}
function persona() { return { perfil: { preferencias_explicitas: ["Vegetariana"] }, afinidades: { restaurantes: {} } }; }
function input(candidates) { return { meal_window: "ALMOCO", instant_utc: "2026-01-01T12:00:00Z", eligible_candidates: candidates }; }

test("V2.1 applies preference precedence only inside the eligible universe", () => {
    const result = decideV2_1({ input: input([candidate("preferred", "Vegetariana", 60), candidate("cheap", "Massas", 20)]), persona: persona() });
    assert.equal(result.model_version, VERSION);
    assert.equal(result.candidate_id, "preferred");
    assert.equal(result.preference_precedence_applied, true);
});

test("V2.1 never reintroduces an ineligible candidate", () => {
    const result = decideV2_1({ input: input([candidate("only", "Massas", 20)]), persona: persona() });
    assert.equal(result.candidate_id, "only");
    assert.equal(result.preference_precedence_applied, false);
});

test("V2.1 preserves zero adjustment and confidence without signals", () => {
    const result = decideV2_1({ input: input([candidate("a", "Vegetariana"), candidate("b", "Massas")]), persona: persona(), signals: [] });
    assert.equal(result.adjustment, 0);
    assert.equal(result.confidence, 0);
    assert.equal(result.effective_samples, 0);
});
