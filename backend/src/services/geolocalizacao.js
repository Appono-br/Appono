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

const cacheGeocodificacao = new Map();
let proximaConsultaEm = 0;

async function consultarNominatimResultados(params, limite = 1) {
    const chave = JSON.stringify({ params, limite });
    const emCache = cacheGeocodificacao.get(chave);
    if (emCache && emCache.expiraEm > Date.now()) return emCache.resultados;
    try {
        const espera = Math.max(0, proximaConsultaEm - Date.now());
        if (espera) await new Promise((resolve) => setTimeout(resolve, espera));
        proximaConsultaEm = Date.now() + 1100;
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", String(Math.min(Math.max(limite, 1), 5)));
        url.searchParams.set("countrycodes", "br");
        Object.entries(params).forEach(([chave, valor]) => {
            if (valor) url.searchParams.set(chave, valor);
        });
        const controller = new AbortController();
        const temporizador = setTimeout(() => controller.abort(), 6000);
        const resposta = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": "Appono MVP contato@appono.com.br",
            },
            signal: controller.signal,
        });
        clearTimeout(temporizador);
        if (!resposta.ok) return [];
        const resultados = await resposta.json();
        const normalizados = (Array.isArray(resultados) ? resultados : []).map((resultado) => {
            const latitude = numeroValido(resultado?.lat);
            const longitude = numeroValido(resultado?.lon);
            if (!coordenadaValida(latitude, longitude)) return null;
            return { place_id: String(resultado.place_id ?? ""), latitude, longitude, nome: resultado.display_name ?? params.q ?? params.street ?? null };
        }).filter(Boolean);
        cacheGeocodificacao.set(chave, { resultados: normalizados, expiraEm: Date.now() + 24 * 60 * 60 * 1000 });
        return normalizados;
    }
    catch {
        return [];
    }
}

async function consultarNominatim(params) {
    return (await consultarNominatimResultados(params, 1))[0] ?? null;
}

async function geocodificarLocalizacao(texto) {
    const consulta = String(texto ?? "").trim();
    if (!consulta) return null;
    return consultarNominatim({ q: `${consulta}, Brasil` });
}

async function geocodificarEnderecoRotina(endereco) {
    const consulta = String(endereco ?? "").trim();
    if (consulta.length < 6) return [];
    return consultarNominatimResultados({ q: `${consulta}, Brasil` }, 5);
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
    geocodificarEnderecoRotina,
    geocodificarLocalizacao,
};
