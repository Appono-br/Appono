"use strict";

const { cifrar, decifrar, obterChave } = require("../agenda/crypto");

function obterChaveCredenciaisMercadoPago() {
    const chave = String(process.env.APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY ?? "").trim();
    try {
        return obterChave(chave);
    }
    catch (_error) {
        const erro = new Error("A chave de proteção das credenciais Mercado Pago não está configurada.");
        erro.code = "MERCADO_PAGO_TOKEN_ENCRYPTION_KEY_MISSING";
        throw erro;
    }
}

function cifrarTokenMercadoPago(token) {
    if (!token) return null;
    obterChaveCredenciaisMercadoPago();
    return cifrar(token, process.env.APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY);
}

function decifrarTokenMercadoPago(tokenCifrado) {
    if (!tokenCifrado) return null;
    obterChaveCredenciaisMercadoPago();
    try {
        return decifrar(tokenCifrado, process.env.APPONO_MERCADO_PAGO_TOKEN_ENCRYPTION_KEY);
    }
    catch (_error) {
        const erro = new Error("Não foi possível ler a credencial protegida do Mercado Pago. Reconecte a conta.");
        erro.code = "MERCADO_PAGO_TOKEN_DECRYPT_FAILED";
        throw erro;
    }
}

function possuiChaveCredenciaisMercadoPago() {
    try {
        obterChaveCredenciaisMercadoPago();
        return true;
    }
    catch (_error) {
        return false;
    }
}

module.exports = {
    cifrarTokenMercadoPago,
    decifrarTokenMercadoPago,
    possuiChaveCredenciaisMercadoPago,
};
