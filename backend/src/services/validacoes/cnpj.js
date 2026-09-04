"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarCnpj = validarCnpj;
exports.consultarCnpjReceitaWs = consultarCnpjReceitaWs;
const comum_1 = require("./comum");
const cacheCnpj = new Map();
function possuiDigitosRepetidos(valor) {
    return /^(\d)\1+$/.test(valor);
}
function calcularDigitoVerificador(base, pesos) {
    const soma = pesos.reduce((total, peso, indice) => total + Number(base[indice]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}
function validarCnpj(valor) {
    const cnpj = (0, comum_1.somenteNumeros)(valor);
    if (cnpj.length !== 14 || possuiDigitosRepetidos(cnpj)) {
        return false;
    }
    const primeiroDigito = calcularDigitoVerificador(cnpj.slice(0, 12), [
        5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    const segundoDigito = calcularDigitoVerificador(cnpj.slice(0, 13), [
        6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
    ]);
    return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`);
}
async function consultarCnpjReceitaWs(valor) {
    const cnpj = (0, comum_1.somenteNumeros)(valor);
    if (!validarCnpj(cnpj)) {
        throw new Error("Informe um CNPJ válido.");
    }
    const resultadoEmCache = (0, comum_1.obterDoCache)(cacheCnpj, cnpj);
    if (resultadoEmCache) {
        return resultadoEmCache;
    }
    try {
        const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;
        const resposta = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(comum_1.TEMPO_LIMITE_REQUISICAO_MS),
        });
        if (!resposta.ok) {
            throw new Error("A ReceitaWS não respondeu corretamente.");
        }
        const dados = (await resposta.json());
        if (dados.status?.toUpperCase() === "ERROR") {
            throw new Error(dados.message ?? "CNPJ não encontrado.");
        }
        return (0, comum_1.salvarNoCache)(cacheCnpj, cnpj, {
            cnpj,
            razaoSocial: dados.nome ?? "",
            nomeFantasia: dados.fantasia ?? "",
            situacao: dados.situacao ?? "",
        });
    }
    catch (erro) {
        if (erro instanceof Error && erro.message.includes("CNPJ")) {
            throw erro;
        }
        throw new Error("Não foi possível validar o CNPJ na ReceitaWS agora.");
    }
}
