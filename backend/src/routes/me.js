"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const comum_1 = require("../services/validacoes/comum");
exports.meRouter = (0, express_1.Router)();
function textoOpcional(valor) {
    return typeof valor === "string" ? valor.trim() : undefined;
}
function prepararPerfilParaResposta(perfil) {
    return perfil;
}
function obterEmailsAdministradores() {
    return String(process.env.APPONO_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}
function usuarioEhAdministrador(user) {
    const email = String(user?.email ?? "").toLowerCase();
    return Boolean(email && obterEmailsAdministradores().includes(email));
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
async function geocodificarLocalizacao(consulta) {
    if (!consulta.trim()) return null;
    try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        url.searchParams.set("countrycodes", "br");
        url.searchParams.set("q", `${consulta}, Brasil`);
        const resposta = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "Appono MVP contato@appono.com.br",
            },
        });
        if (!resposta.ok) return null;
        const resultados = await resposta.json();
        const resultado = Array.isArray(resultados) ? resultados[0] : null;
        const latitude = Number(resultado?.lat);
        const longitude = Number(resultado?.lon);
        if (!coordenadaValida(latitude, longitude)) return null;
        return { latitude, longitude };
    }
    catch {
        return null;
    }
}
async function geocodificarEnderecoRestaurante(endereco, cep) {
    const enderecoInformado = String(endereco ?? "").trim();
    const enderecoSemComplemento = removerComplementoEndereco(enderecoInformado);
    const consultas = [
        [enderecoInformado, cep].filter(Boolean).join(", "),
        enderecoSemComplemento !== enderecoInformado
            ? [enderecoSemComplemento, cep].filter(Boolean).join(", ")
            : "",
        enderecoSemComplemento,
        cep,
    ].filter(Boolean);
    for (const consulta of [...new Set(consultas)]) {
        const coordenadas = await geocodificarLocalizacao(consulta);
        if (coordenadas) return coordenadas;
    }
    return null;
}
function erroColunaGeolocalizacaoAusente(error) {
    const mensagem = String(error?.message ?? "").toLowerCase();
    return mensagem.includes("latitude") || mensagem.includes("longitude") || mensagem.includes("geocodificado");
}
async function obterPerfil(supabase, userId) {
    const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id_auth", userId)
        .maybeSingle();
    if (clienteError) {
        throw new Error(clienteError.message);
    }
    if (cliente) {
        return { tipo: "cliente", perfil: cliente };
    }
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("id_auth", userId)
        .maybeSingle();
    if (restauranteError) {
        throw new Error(restauranteError.message);
    }
    return restaurante
        ? { tipo: "restaurante", perfil: restaurante }
        : null;
}
exports.meRouter.get("/", auth_1.requireAuth, async (_req, res) => {
    const supabase = supabase_1.supabaseAdmin ?? (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        if (usuarioEhAdministrador(res.locals.user)) {
            return res.json({
                tipo: "admin",
                perfil: {
                    nome: "Administracao Appono",
                    email: res.locals.user.email,
                },
            });
        }
        const perfil = await obterPerfil(supabase, res.locals.user.id);
        return perfil
            ? res.json(prepararPerfilParaResposta(perfil))
            : res.status(404).json({ error: "Perfil nao encontrado." });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel carregar o perfil.",
        });
    }
});
exports.meRouter.patch("/", auth_1.requireAuth, async (req, res) => {
    const supabase = supabase_1.supabaseAdmin ?? (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const perfilAtual = await obterPerfil(supabase, res.locals.user.id);
    if (!perfilAtual) {
        return res.status(404).json({ error: "Perfil nao encontrado." });
    }
    const body = req.body;
    const camposImutaveis = ["cpf", "cnpj", "dt_nasc", "birthDate", "razao_social"].filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo));
    if (camposImutaveis.length) {
        return res.status(400).json({
            error: "CPF, CNPJ, data de nascimento e razao social nao podem ser alterados.",
        });
    }
    const camposObrigatoriosInformados = ["nome", "telefone", "email"].filter((campo) => Object.prototype.hasOwnProperty.call(req.body, campo) &&
        !textoOpcional(req.body[campo]));
    if (camposObrigatoriosInformados.length) {
        return res.status(400).json({
            error: `Campos obrigatorios nao podem ficar vazios: ${camposObrigatoriosInformados.join(", ")}.`,
        });
    }
    const email = textoOpcional(body.email)?.toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Informe um e-mail valido." });
    }
    const dadosComuns = {
        nome: textoOpcional(body.nome),
        telefone: textoOpcional(body.telefone),
        email,
    };
    const atualizacao = Object.fromEntries(Object.entries(perfilAtual.tipo === "restaurante"
        ? {
            ...dadosComuns,
            cep: textoOpcional(body.cep)
                ? (0, comum_1.somenteNumeros)(body.cep).slice(0, 8)
                : undefined,
            endereco: textoOpcional(body.endereco),
            horario_funcionamento: textoOpcional(body.horario_funcionamento),
            valor_minimo_reserva_por_pessoa: typeof body.valor_minimo_reserva_por_pessoa === "number" &&
                body.valor_minimo_reserva_por_pessoa >= 0
                ? body.valor_minimo_reserva_por_pessoa
                : undefined,
            preferencias_notificacao: body.preferencias_notificacao,
            configuracao_operacao: body.configuracao_operacao,
        }
        : dadosComuns).filter(([, valor]) => valor !== undefined));
    if (!Object.keys(atualizacao).length) {
        return res.status(400).json({ error: "Nenhum campo editavel foi informado." });
    }
    const tabela = perfilAtual.tipo === "cliente" ? "clientes" : "restaurantes";
    if (perfilAtual.tipo === "restaurante" &&
        (Object.prototype.hasOwnProperty.call(atualizacao, "endereco") ||
            Object.prototype.hasOwnProperty.call(atualizacao, "cep"))) {
        const coordenadas = await geocodificarEnderecoRestaurante(atualizacao.endereco ?? perfilAtual.perfil.endereco, atualizacao.cep ?? perfilAtual.perfil.cep);
        if (coordenadas) {
            atualizacao.latitude = coordenadas.latitude;
            atualizacao.longitude = coordenadas.longitude;
            atualizacao.geocodificado_em = new Date().toISOString();
        }
    }
    let { error } = await supabase.from(tabela).update(atualizacao).eq("id_auth", res.locals.user.id);
    if (error && perfilAtual.tipo === "restaurante" && erroColunaGeolocalizacaoAusente(error)) {
        delete atualizacao.latitude;
        delete atualizacao.longitude;
        delete atualizacao.geocodificado_em;
        const tentativaSemGeolocalizacao = await supabase.from(tabela).update(atualizacao).eq("id_auth", res.locals.user.id);
        error = tentativaSemGeolocalizacao.error;
    }
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const perfilAtualizado = await obterPerfil(supabase, res.locals.user.id);
    return res.json({
        ...prepararPerfilParaResposta(perfilAtualizado),
        message: "Alteracoes salvas com sucesso.",
    });
});
exports.meRouter.patch("/dados-bancarios", auth_1.requireAuth, async (req, res) => {
    const supabase = supabase_1.supabaseAdmin ?? (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const perfilAtual = await obterPerfil(supabase, res.locals.user.id);
    if (!perfilAtual || perfilAtual.tipo !== "restaurante") {
        return res.status(403).json({ error: "Apenas restaurantes podem alterar dados bancarios." });
    }
    const body = req.body;
    const informouAlgumDado = [
        body.bankCode,
        body.agency,
        body.checkingAccount,
        body.pixKey,
    ].some((valor) => Boolean(textoOpcional(valor)));
    if (!informouAlgumDado) {
        return res.status(400).json({ error: "Informe ao menos um dado bancario para atualizar." });
    }
    const erroValidacao = (0, dados_bancarios_1.validarDadosBancarios)(body);
    if (erroValidacao) {
        return res.status(400).json({ error: erroValidacao });
    }
    const dados = {
        id_restaurante: perfilAtual.perfil.id_restaurante,
        status_cadastro: "pendente_validacao",
        provedor_pagamento: "integracao_financeira_externa",
        referencia_externa: null,
        updated_at: new Date().toISOString(),
    };
    const possuiRegistro = Boolean(perfilAtual.perfil.dados_bancarios_restaurante?.length);
    const operacao = possuiRegistro
        ? supabase
            .from("dados_bancarios_restaurante")
            .update(dados)
            .eq("id_restaurante", perfilAtual.perfil.id_restaurante)
        : supabase.from("dados_bancarios_restaurante").insert(dados);
    const { error } = await operacao;
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const perfilAtualizado = await obterPerfil(supabase, res.locals.user.id);
    return res.json({
        ...prepararPerfilParaResposta(perfilAtualizado),
        message: "Dados bancarios salvos com sucesso.",
    });
});
