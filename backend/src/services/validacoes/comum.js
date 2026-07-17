"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DURACAO_CACHE_CONSULTA_MS = exports.TEMPO_LIMITE_REQUISICAO_MS = void 0;
exports.somenteNumeros = somenteNumeros;
exports.obterDoCache = obterDoCache;
exports.salvarNoCache = salvarNoCache;
exports.TEMPO_LIMITE_REQUISICAO_MS = 7000;
exports.DURACAO_CACHE_CONSULTA_MS = 10 * 60 * 1000;
function somenteNumeros(valor) {
    return (valor ?? "").replace(/\D/g, "");
}
function obterDoCache(cache, chave) {
    const item = cache.get(chave);
    if (!item) {
        return null;
    }
    if (item.expiraEm <= Date.now()) {
        cache.delete(chave);
        return null;
    }
    return item.valor;
}
function salvarNoCache(cache, chave, valor) {
    cache.set(chave, {
        valor,
        expiraEm: Date.now() + exports.DURACAO_CACHE_CONSULTA_MS,
    });
    return valor;
}
