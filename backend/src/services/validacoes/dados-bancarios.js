"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarDadosBancarios = validarDadosBancarios;
const comum_1 = require("./comum");
const cnpj_1 = require("./cnpj");
const cpf_1 = require("./cpf");
function validarDadosBancarios(dados) {
    const codigoBanco = (0, comum_1.somenteNumeros)(dados.bankCode);
    const agencia = (0, comum_1.somenteNumeros)(dados.agency);
    const conta = (dados.checkingAccount ?? "").trim();
    const chavePix = (dados.pixKey ?? "").trim();
    if (codigoBanco && codigoBanco.length !== 3) {
        return "O codigo do banco deve possuir 3 digitos.";
    }
    if (agencia && (agencia.length < 1 || agencia.length > 5)) {
        return "A agencia deve possuir entre 1 e 5 digitos.";
    }
    if (conta && !/^\d{1,20}(-[\dXx])?$/.test(conta)) {
        return "A conta deve possuir ate 20 numeros e, opcionalmente, um digito apos o hifen. Exemplo: 12345-6.";
    }
    if (chavePix && !validarChavePix(chavePix)) {
        return "Informe uma chave Pix valida.";
    }
    return null;
}
function validarChavePix(valor) {
    const numeros = (0, comum_1.somenteNumeros)(valor);
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    const telefoneValido = /^\+55\d{10,11}$/.test(valor) || /^\d{10,11}$/.test(numeros);
    const chaveAleatoriaValida = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(valor);
    return ((0, cpf_1.validarCpf)(numeros) ||
        (0, cnpj_1.validarCnpj)(numeros) ||
        emailValido ||
        telefoneValido ||
        chaveAleatoriaValida);
}
