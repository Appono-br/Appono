"use strict";

function numeroValido(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function coordenadaValida(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude) &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180;
}

function removerComplementoEndereco(endereco) {
    return String(endereco ?? "")
        .replace(/,\s*(apto|apartamento|sala|bloco|cj|conjunto|loja)\b[^,]*/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function extrairEnderecoEstruturado(endereco, cep) {
    const partes = String(endereco ?? "")
        .split(",")
        .map((parte) => parte.trim())
        .filter(Boolean);
    const [logradouro = "", numero = "", , bairro = "", cidade = "", uf = ""] = partes;
    const rua = [numero, logradouro].filter(Boolean).join(" ").trim();
    if (!rua && !cidade && !cep) return null;
    return {
        street: rua || undefined,
        city: cidade || undefined,
        state: uf || undefined,
        postalcode: cep || undefined,
        country: "Brasil",
    };
}

async function consultarNominatim(params) {
    try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        url.searchParams.set("countrycodes", "br");
        Object.entries(params).forEach(([chave, valor]) => {
            if (valor) url.searchParams.set(chave, valor);
        });
        const resposta = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "Appono MVP contato@appono.com.br",
            },
        });
        if (!resposta.ok) return null;
        const resultados = await resposta.json();
        const resultado = Array.isArray(resultados) ? resultados[0] : null;
        const latitude = numeroValido(resultado?.lat);
        const longitude = numeroValido(resultado?.lon);
        if (!coordenadaValida(latitude, longitude)) return null;
        return {
            latitude,
            longitude,
            nome: resultado?.display_name ?? params.q ?? params.street ?? null,
        };
    }
    catch {
        return null;
    }
}

async function geocodificarLocalizacao(texto) {
    const consulta = String(texto ?? "").trim();
    if (!consulta) return null;
    return consultarNominatim({ q: `${consulta}, Brasil` });
}

async function geocodificarEnderecoRestaurante(restauranteOuEndereco, cepInformado) {
    const endereco = typeof restauranteOuEndereco === "object"
        ? String(restauranteOuEndereco?.endereco ?? "").trim()
        : String(restauranteOuEndereco ?? "").trim();
    const cep = typeof restauranteOuEndereco === "object"
        ? restauranteOuEndereco?.cep
        : cepInformado;
    const enderecoSemComplemento = removerComplementoEndereco(endereco);
    const estruturado = extrairEnderecoEstruturado(enderecoSemComplemento, cep);
    const tentativas = [
        estruturado ? () => consultarNominatim(estruturado) : null,
        () => geocodificarLocalizacao([endereco, cep].filter(Boolean).join(", ")),
        enderecoSemComplemento !== endereco
            ? () => geocodificarLocalizacao([enderecoSemComplemento, cep].filter(Boolean).join(", "))
            : null,
        () => geocodificarLocalizacao(enderecoSemComplemento),
        cep ? () => geocodificarLocalizacao(cep) : null,
    ].filter(Boolean);
    for (const tentativa of tentativas) {
        const coordenadas = await tentativa();
        if (coordenadas) return coordenadas;
    }
    return null;
}

module.exports = {
    coordenadaValida,
    geocodificarEnderecoRestaurante,
    geocodificarLocalizacao,
};
