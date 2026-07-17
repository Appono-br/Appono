"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const cep_1 = require("../services/validacoes/cep");
const cnpj_1 = require("../services/validacoes/cnpj");
const comum_1 = require("../services/validacoes/comum");
const cpf_1 = require("../services/validacoes/cpf");
const dados_bancarios_1 = require("../services/validacoes/dados-bancarios");
exports.authRouter = (0, express_1.Router)();
const frontendOrigin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
function verificarCamposObrigatorios(body, fields) {
    const missing = fields.filter((field) => !body[field]);
    return missing.length ? `Campos obrigatorios ausentes: ${missing.join(", ")}` : null;
}
function montarEndereco(...parts) {
    return parts.filter(Boolean).join(", ");
}
function obterUrlRedirecionamentoEmail() {
    return `${frontendOrigin}/auth/callback`;
}
function obterMensagemErroAutenticacao(message) {
    if (!message) {
        return "Erro ao criar usuario.";
    }
    const normalizedMessage = message.toLowerCase();
    if (normalizedMessage.includes("email rate limit exceeded") ||
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("limite de envio")) {
        return "Limite temporario de envio de e-mails atingido. Aguarde alguns minutos ou tente novamente mais tarde.";
    }
    return message;
}
async function obterPerfil(accessToken) {
    const supabase = (0, supabase_1.createUserSupabaseClient)(accessToken);
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
        .select("*")
        .maybeSingle();
    if (restauranteError) {
        throw new Error(restauranteError.message);
    }
    if (restaurante) {
        return { tipo: "restaurante", perfil: restaurante };
    }
    return null;
}
async function confirmarEEntrarComUsuarioCriado(userId, email, password) {
    if (!supabase_1.supabaseAdmin) {
        return null;
    }
    const { error: confirmError } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (confirmError) {
        throw new Error("Nao foi possivel ativar sua conta agora.");
    }
    const { data, error } = await supabase_1.supabaseAuth.auth.signInWithPassword({
        email,
        password,
    });
    if (error || !data.session) {
        throw new Error("Conta criada. Entre com seu e-mail e senha.");
    }
    return data;
}
exports.authRouter.post("/login", async (req, res) => {
    if (!(0, supabase_1.isSupabaseConfigured)()) {
        return res.status(503).json({
            error: "O acesso esta temporariamente indisponivel. Tente novamente mais tarde.",
        });
    }
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Informe e-mail e senha." });
    }
    const { data, error } = await supabase_1.supabaseAuth.auth.signInWithPassword({
        email,
        password,
    });
    if (error || !data.session) {
        return res.status(401).json({
            error: error?.message.toLowerCase().includes("email not confirmed")
                ? "Confirme seu e-mail antes de entrar."
                : "Credenciais invalidas.",
        });
    }
    const profile = await obterPerfil(data.session.access_token);
    if (!profile) {
        return res.status(404).json({ error: "Perfil nao encontrado para este usuario." });
    }
    return res.json({
        ...profile,
        user: data.user,
        session: data.session,
    });
});
exports.authRouter.post("/register/client", async (req, res) => {
    if (!(0, supabase_1.isSupabaseConfigured)()) {
        return res.status(503).json({
            error: "O cadastro esta temporariamente indisponivel. Tente novamente mais tarde.",
        });
    }
    const body = req.body;
    const missing = verificarCamposObrigatorios(body, [
        "name",
        "birthDate",
        "cpf",
        "email",
        "phone",
        "password",
    ]);
    if (missing) {
        return res.status(400).json({ error: missing });
    }
    if (!(0, cpf_1.validarCpf)(body.cpf)) {
        return res.status(400).json({ error: "Informe um CPF valido." });
    }
    const cpf = (0, comum_1.somenteNumeros)(body.cpf);
    const { data: authData, error: authError } = await supabase_1.supabaseAuth.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
            emailRedirectTo: obterUrlRedirecionamentoEmail(),
            data: {
                appono_profile: {
                    tipo: "cliente",
                    nome: body.name,
                    cpf,
                    telefone: body.phone,
                    email: body.email,
                    dt_nasc: body.birthDate,
                },
            },
        },
    });
    if (authError || !authData.user) {
        return res.status(400).json({ error: obterMensagemErroAutenticacao(authError?.message) });
    }
    if (!authData.session) {
        const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(authData.user.id, body.email, body.password);
        if (confirmedAuthData?.session) {
            const profile = await obterPerfil(confirmedAuthData.session.access_token);
            return res.status(201).json({
                ...profile,
                user: confirmedAuthData.user,
                session: confirmedAuthData.session,
            });
        }
        return res.status(202).json({
            user: authData.user,
            session: null,
            message: "Conta criada. Confirme o e-mail para ativar o acesso.",
        });
    }
    const profile = await obterPerfil(authData.session.access_token);
    return res.status(201).json({
        ...profile,
        user: authData.user,
        session: authData.session,
    });
});
exports.authRouter.post("/register/restaurant", async (req, res) => {
    if (!(0, supabase_1.isSupabaseConfigured)()) {
        return res.status(503).json({
            error: "O cadastro esta temporariamente indisponivel. Tente novamente mais tarde.",
        });
    }
    const body = req.body;
    const missing = verificarCamposObrigatorios(body, [
        "storeName",
        "legalName",
        "email",
        "phone",
        "cnpj",
        "cep",
        "address",
        "neighborhood",
        "city",
        "uf",
        "number",
        "tables",
        "password",
    ]);
    if (missing) {
        return res.status(400).json({ error: missing });
    }
    let validatedCnpj;
    let validatedCep;
    try {
        [validatedCnpj, validatedCep] = await Promise.all([
            (0, cnpj_1.consultarCnpjReceitaWs)(body.cnpj),
            (0, cep_1.consultarCepViaCep)(body.cep),
        ]);
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Nao foi possivel validar os dados do restaurante.",
        });
    }
    if (validatedCnpj.situacao &&
        validatedCnpj.situacao.toUpperCase() !== "ATIVA") {
        return res.status(400).json({
            error: `O CNPJ informado esta com situacao ${validatedCnpj.situacao}.`,
        });
    }
    const bankError = (0, dados_bancarios_1.validarDadosBancarios)(body);
    if (bankError) {
        return res.status(400).json({ error: bankError });
    }
    const validatedAddressBody = {
        ...body,
        address: validatedCep.rua || body.address,
        neighborhood: validatedCep.bairro || body.neighborhood,
        city: validatedCep.cidade || body.city,
        uf: validatedCep.estado || body.uf,
    };
    const { data: authData, error: authError } = await supabase_1.supabaseAuth.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
            emailRedirectTo: obterUrlRedirecionamentoEmail(),
            data: {
                appono_profile: {
                    tipo: "restaurante",
                    nome: body.storeName,
                    razao_social: body.legalName,
                    cnpj: validatedCnpj.cnpj,
                    telefone: body.phone,
                    email: body.email,
                    cep: validatedCep.cep,
                    endereco: montarEndereco(validatedAddressBody.address, validatedAddressBody.number, validatedAddressBody.complement, validatedAddressBody.neighborhood, validatedAddressBody.city, validatedAddressBody.uf),
                    horario_funcionamento: "A definir",
                    quantidade_mesas: body.tables,
                    dados_bancarios: {
                        cod_banco: (0, comum_1.somenteNumeros)(body.bankCode),
                        agencia: (0, comum_1.somenteNumeros)(body.agency),
                        conta_corrente: body.checkingAccount,
                        chave_pix: body.pixKey,
                    },
                },
            },
        },
    });
    if (authError || !authData.user) {
        return res.status(400).json({ error: obterMensagemErroAutenticacao(authError?.message) });
    }
    if (!authData.session) {
        const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(authData.user.id, body.email, body.password);
        if (confirmedAuthData?.session) {
            const profile = await obterPerfil(confirmedAuthData.session.access_token);
            return res.status(201).json({
                ...profile,
                user: confirmedAuthData.user,
                session: confirmedAuthData.session,
            });
        }
        return res.status(202).json({
            user: authData.user,
            session: null,
            message: "Conta criada. Confirme o e-mail para ativar o acesso.",
        });
    }
    const profile = await obterPerfil(authData.session.access_token);
    return res.status(201).json({
        ...profile,
        user: authData.user,
        session: authData.session,
    });
});
