"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const comum_1 = require("../services/validacoes/comum");
const dados_bancarios_1 = require("../services/validacoes/dados-bancarios");
exports.meRouter = (0, express_1.Router)();
function textoOpcional(valor) {
    return typeof valor === "string" ? valor.trim() : undefined;
}
async function obterPerfil(supabase) {
    const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .maybeSingle();
    if (clienteError) {
        throw new Error(clienteError.message);
    }
    if (cliente) {
        return { tipo: "cliente", perfil: cliente };
    }
    const { data: restaurante, error: restauranteError } = await supabase
        .from("restaurantes")
        .select("*, dados_bancarios_restaurante(*)")
        .maybeSingle();
    if (restauranteError) {
        throw new Error(restauranteError.message);
    }
    return restaurante
        ? { tipo: "restaurante", perfil: restaurante }
        : null;
}
exports.meRouter.get("/", auth_1.requireAuth, async (_req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    try {
        const perfil = await obterPerfil(supabase);
        return perfil
            ? res.json(perfil)
            : res.status(404).json({ error: "Perfil nao encontrado." });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel carregar o perfil.",
        });
    }
});
exports.meRouter.patch("/", auth_1.requireAuth, async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const perfilAtual = await obterPerfil(supabase);
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
    const { error } = await supabase.from(tabela).update(atualizacao).eq("id_auth", res.locals.user.id);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    const perfilAtualizado = await obterPerfil(supabase);
    return res.json({
        ...perfilAtualizado,
        message: "Alteracoes salvas com sucesso.",
    });
});
exports.meRouter.patch("/dados-bancarios", auth_1.requireAuth, async (req, res) => {
    const supabase = (0, supabase_1.createUserSupabaseClient)(res.locals.accessToken);
    const perfilAtual = await obterPerfil(supabase);
    if (!perfilAtual || perfilAtual.tipo !== "restaurante") {
        return res.status(403).json({ error: "Apenas restaurantes podem alterar dados bancarios." });
    }
    const body = req.body;
    const erroValidacao = (0, dados_bancarios_1.validarDadosBancarios)(body);
    if (erroValidacao) {
        return res.status(400).json({ error: erroValidacao });
    }
    const dados = {
        id_restaurante: perfilAtual.perfil.id_restaurante,
        cod_banco: (0, comum_1.somenteNumeros)(body.bankCode),
        agencia: (0, comum_1.somenteNumeros)(body.agency),
        conta_corrente: textoOpcional(body.checkingAccount),
        chave_pix: textoOpcional(body.pixKey),
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
    const perfilAtualizado = await obterPerfil(supabase);
    return res.json({
        ...perfilAtualizado,
        message: "Dados bancarios salvos com sucesso.",
    });
});
