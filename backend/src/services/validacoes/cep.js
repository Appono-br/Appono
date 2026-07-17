"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarCepViaCep = consultarCepViaCep;
const comum_1 = require("./comum");
const cacheCep = new Map();
async function consultarCepViaCep(valor) {
    const cep = (0, comum_1.somenteNumeros)(valor);
    if (cep.length !== 8) {
        throw new Error("Informe um CEP valido com 8 digitos.");
    }
    const resultadoEmCache = (0, comum_1.obterDoCache)(cacheCep, cep);
    if (resultadoEmCache) {
        return resultadoEmCache;
    }
    try {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        const resposta = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(comum_1.TEMPO_LIMITE_REQUISICAO_MS),
        });
        if (!resposta.ok) {
            throw new Error("O ViaCEP nao respondeu corretamente.");
        }
        const dados = (await resposta.json());
        if (dados.erro) {
            throw new Error("CEP nao encontrado.");
        }
        return (0, comum_1.salvarNoCache)(cacheCep, cep, {
            cep,
            rua: dados.logradouro ?? "",
            bairro: dados.bairro ?? "",
            cidade: dados.localidade ?? "",
            estado: dados.uf ?? "",
        });
    }
    catch (erro) {
        if (erro instanceof Error && erro.message === "CEP nao encontrado.") {
            throw erro;
        }
        throw new Error("Nao foi possivel validar o CEP no ViaCEP agora.");
    }
}
