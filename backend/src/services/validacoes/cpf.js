"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarCpf = validarCpf;
const comum_1 = require("./comum");
function possuiDigitosRepetidos(valor) {
    return /^(\d)\1+$/.test(valor);
}
function calcularDigitoVerificador(base, pesos) {
    const soma = pesos.reduce((total, peso, indice) => total + Number(base[indice]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}
function validarCpf(valor) {
    const cpf = (0, comum_1.somenteNumeros)(valor);
    if (cpf.length !== 11 || possuiDigitosRepetidos(cpf)) {
        return false;
    }
    const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9), [
        10, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10), [
        11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    return cpf.endsWith(`${primeiroDigito}${segundoDigito}`);
}
