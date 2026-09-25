"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { enderecoAtivo, normalizarEnderecos } = require("../src/domain/routine-addresses");

test("preserva varios enderecos e escolhe somente um ativo", () => {
    const enderecos = normalizarEnderecos([
        { id: "casa", tipo: "CASA", nome: "Casa", endereco: "Rua A, 10", ativo: false },
        { id: "trabalho", tipo: "TRABALHO", nome: "Escritorio", endereco: "Avenida B, 20", ativo: true },
    ]);
    assert.equal(enderecos.length, 2);
    assert.equal(enderecos.filter((item) => item.ativo).length, 1);
    assert.equal(enderecoAtivo(enderecos, "trabalho").endereco, "Avenida B, 20");
});

test("migra o endereco legado para Casa quando a lista ainda nao existe", () => {
    const enderecos = normalizarEnderecos([], "Rua antiga, 42");
    assert.deepEqual(enderecos.map(({ tipo, endereco, ativo }) => ({ tipo, endereco, ativo })), [
        { tipo: "CASA", endereco: "Rua antiga, 42", ativo: true },
    ]);
});

test("nao permite lista sem endereco utilizavel", () => {
    assert.deepEqual(normalizarEnderecos([{ id: "vazio", tipo: "CASA", endereco: "" }]), []);
});
