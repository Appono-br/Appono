"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizarConsultaEndereco } = require("../src/services/geolocalizacao");

test("normaliza CEP e travessao antes de consultar o endereco da rotina", () => {
    assert.equal(
        normalizarConsultaEndereco("Alameda Rio Negro, 500, Alphaville, Barueri – SP, CEP 06454-000"),
        "Alameda Rio Negro, 500, Alphaville, Barueri, SP, 06454-000",
    );
});

test("preserva endereco comum sem acrescentar separadores", () => {
    assert.equal(
        normalizarConsultaEndereco("Alameda Rio Negro 500, Barueri, SP"),
        "Alameda Rio Negro 500, Barueri, SP",
    );
});
