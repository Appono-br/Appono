export function normalizarBusca(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s#:-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function tokenizarBusca(valor) {
    return normalizarBusca(valor).split(" ").filter(Boolean);
}

export function textoBusca(...valores) {
    return valores
        .flat(Number.POSITIVE_INFINITY)
        .filter((valor) => valor !== null && valor !== undefined && valor !== "")
        .map((valor) => String(valor))
        .join(" ");
}

export function calcularPontuacaoBusca(termo, campos = []) {
    const termoNormalizado = normalizarBusca(termo);
    if (!termoNormalizado) {
        return 1;
    }

    const tokens = tokenizarBusca(termoNormalizado);
    if (!tokens.length) {
        return 1;
    }

    let pontuacao = 0;
    let tokensEncontrados = 0;

    for (const campo of campos) {
        const texto = normalizarBusca(campo);
        if (!texto) {
            continue;
        }

        if (texto === termoNormalizado) {
            pontuacao += 100;
        } else if (texto.startsWith(termoNormalizado)) {
            pontuacao += 70;
        } else if (texto.includes(termoNormalizado)) {
            pontuacao += 45;
        }

        for (const token of tokens) {
            if (texto === token) {
                pontuacao += 20;
                tokensEncontrados += 1;
            } else if (texto.startsWith(token)) {
                pontuacao += 12;
                tokensEncontrados += 1;
            } else if (texto.includes(token)) {
                pontuacao += 7;
                tokensEncontrados += 1;
            }
        }
    }

    return tokensEncontrados >= tokens.length ? pontuacao + tokensEncontrados : 0;
}

export function filtrarOrdenarPorBusca(itens, termo, obterCampos) {
    const termoNormalizado = normalizarBusca(termo);
    if (!termoNormalizado) {
        return itens;
    }

    return itens
        .map((item, indice) => ({
            item,
            indice,
            pontuacao: calcularPontuacaoBusca(termoNormalizado, obterCampos(item)),
        }))
        .filter((resultado) => resultado.pontuacao > 0)
        .sort((a, b) => b.pontuacao - a.pontuacao || a.indice - b.indice)
        .map((resultado) => resultado.item);
}
