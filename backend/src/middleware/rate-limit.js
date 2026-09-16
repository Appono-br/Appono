"use strict";

function criarRateLimiter({ janelaMs, limite, chave = (req, res) => res.locals.user?.id ?? req.ip, agora = () => Date.now() }) {
    const tentativas = new Map();
    const janela = Number(janelaMs);
    const maximo = Number(limite);

    if (!Number.isInteger(janela) || janela <= 0 || !Number.isInteger(maximo) || maximo <= 0) {
        throw new Error("Configuração de rate limit inválida.");
    }

    return (req, res, next) => {
        const chaveAtual = String(chave(req, res) ?? req.ip ?? "anonimo");
        const instante = agora();
        const atual = tentativas.get(chaveAtual);
        const inicio = !atual || instante >= atual.reiniciaEm ? instante : atual.inicio;
        const quantidade = !atual || instante >= atual.reiniciaEm ? 1 : atual.quantidade + 1;
        const reiniciaEm = inicio + janela;
        tentativas.set(chaveAtual, { inicio, quantidade, reiniciaEm });

        res.set("RateLimit-Limit", String(maximo));
        res.set("RateLimit-Remaining", String(Math.max(0, maximo - quantidade)));
        res.set("RateLimit-Reset", String(Math.ceil(reiniciaEm / 1000)));
        if (quantidade > maximo) {
            res.set("Retry-After", String(Math.max(1, Math.ceil((reiniciaEm - instante) / 1000))));
            return res.status(429).json({ code: "RATE_LIMITED", error: "Muitas tentativas. Aguarde um momento e tente novamente." });
        }
        return next();
    };
}

module.exports = { criarRateLimiter };
