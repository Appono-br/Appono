"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotasValidacoes = void 0;
const express_1 = require("express");
const cep_1 = require("../services/validacoes/cep");
const cnpj_1 = require("../services/validacoes/cnpj");
const comum_1 = require("../services/validacoes/comum");
const cpf_1 = require("../services/validacoes/cpf");
exports.rotasValidacoes = (0, express_1.Router)();
exports.rotasValidacoes.get("/cpf/:cpf", (req, res) => {
    const cpf = (0, comum_1.somenteNumeros)(req.params.cpf);
    if (!(0, cpf_1.validarCpf)(cpf)) {
        return res.status(400).json({ error: "CPF inválido." });
    }
    return res.json({ valid: true, cpf });
});
exports.rotasValidacoes.get("/cep/:cep", async (req, res) => {
    try {
        return res.json(await (0, cep_1.consultarCepViaCep)(req.params.cep));
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "CEP inválido.",
        });
    }
});
exports.rotasValidacoes.get("/cnpj/:cnpj", async (req, res) => {
    try {
        return res.json(await (0, cnpj_1.consultarCnpjReceitaWs)(req.params.cnpj));
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "CNPJ inválido.",
        });
    }
});
