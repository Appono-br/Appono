"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const cep_1 = require("../services/validacoes/cep");
const cnpj_1 = require("../services/validacoes/cnpj");
const comum_1 = require("../services/validacoes/comum");
const cpf_1 = require("../services/validacoes/cpf");
const auth_1 = require("../middleware/auth");
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
    if (normalizedMessage.includes("fetch failed") ||
        normalizedMessage.includes("unable to verify") ||
        normalizedMessage.includes("certificate") ||
        normalizedMessage.includes("network")) {
        return "Nao foi possivel acessar o servico de autenticacao. Verifique a conexao e tente novamente.";
    }
    if (normalizedMessage.includes("email rate limit exceeded") ||
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("limite de envio")) {
        return "Limite temporario de envio de e-mails atingido. Aguarde alguns minutos ou tente novamente mais tarde.";
    }
    return message;
}
function erroAutenticacaoEhInfraestrutura(error) {
    const mensagem = String(error?.message ?? error ?? "").toLowerCase();
    return mensagem.includes("fetch failed") ||
        mensagem.includes("unable to verify") ||
        mensagem.includes("certificate") ||
        mensagem.includes("network") ||
        mensagem.includes("econnreset") ||
        mensagem.includes("enotfound");
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
async function garantirPerfilClienteDoMetadata(user, profile) {
    if (!supabase_1.supabaseAdmin) {
        return null;
    }
    const cpf = (0, comum_1.somenteNumeros)(profile.cpf);
    const { data: clienteExistente, error: clienteExistenteError } = await supabase_1.supabaseAdmin
        .from("clientes")
        .select("*")
        .eq("id_auth", user.id)
        .maybeSingle();
    if (clienteExistenteError) {
        throw new Error(clienteExistenteError.message);
    }
    if (clienteExistente) {
        return { tipo: "cliente", perfil: clienteExistente };
    }
    const { data: cliente, error } = await supabase_1.supabaseAdmin
        .from("clientes")
        .insert({
        id_auth: user.id,
        nome: profile.nome,
        cpf,
        telefone: profile.telefone,
        email: profile.email ?? user.email,
        dt_nasc: profile.dt_nasc,
    })
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    return { tipo: "cliente", perfil: cliente };
}
async function garantirPerfilRestauranteDoMetadata(user, profile) {
    if (!supabase_1.supabaseAdmin) {
        return null;
    }
    const { data: restauranteExistente, error: restauranteExistenteError } = await supabase_1.supabaseAdmin
        .from("restaurantes")
        .select("*")
        .eq("id_auth", user.id)
        .maybeSingle();
    if (restauranteExistenteError) {
        throw new Error(restauranteExistenteError.message);
    }
    if (restauranteExistente) {
        return { tipo: "restaurante", perfil: restauranteExistente };
    }
    const quantidadeMesas = Math.max(Number.parseInt(String(profile.quantidade_mesas), 10) || 0, 0);
    const { data: restaurante, error } = await supabase_1.supabaseAdmin
        .from("restaurantes")
        .insert({
        id_auth: user.id,
        nome: profile.nome,
        razao_social: profile.razao_social,
        cnpj: (0, comum_1.somenteNumeros)(profile.cnpj),
        telefone: profile.telefone,
        email: profile.email ?? user.email,
        cep: (0, comum_1.somenteNumeros)(profile.cep),
        endereco: profile.endereco,
        horario_funcionamento: profile.horario_funcionamento ?? "A definir",
    })
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    if (quantidadeMesas > 0) {
        const mesas = Array.from({ length: quantidadeMesas }, (_, index) => ({
            id_restaurante: restaurante.id_restaurante,
            numero_mesa: index + 1,
            capacidade: 4,
        }));
        const { error: mesasError } = await supabase_1.supabaseAdmin
            .from("mesas")
            .insert(mesas);
        if (mesasError) {
            throw new Error(mesasError.message);
        }
    }
    return { tipo: "restaurante", perfil: restaurante };
}
async function garantirPerfilDoMetadata(user) {
    const profile = user?.user_metadata?.appono_profile;
    if (!profile?.tipo) {
        return null;
    }
    if (profile.tipo === "cliente") {
        return garantirPerfilClienteDoMetadata(user, profile);
    }
    if (profile.tipo === "restaurante") {
        return garantirPerfilRestauranteDoMetadata(user, profile);
    }
    return null;
}
async function obterPerfil(accessToken, userId) {
    const supabase = supabase_1.supabaseAdmin ?? (0, supabase_1.createUserSupabaseClient)(accessToken);
    const clienteAutenticacao = supabase_1.supabaseAdmin ?? supabase_1.supabaseAuth;
    const { data: usuarioAtual } = await clienteAutenticacao.auth.getUser(accessToken);
    if (usuarioEhAdministrador(usuarioAtual?.user)) {
        return {
            tipo: "admin",
            perfil: {
                nome: "Administracao Appono",
                email: usuarioAtual.user.email,
            },
        };
    }
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
    if (restaurante) {
        return { tipo: "restaurante", perfil: restaurante };
    }
    return garantirPerfilDoMetadata(usuarioAtual?.user);
}
async function obterPerfilDoUsuarioAutenticado(res) {
    return obterPerfil(res.locals.accessToken, res.locals.user.id);
}
async function criarPerfilClienteGoogle(res, body) {
    if (!supabase_1.supabaseAdmin) {
        throw new Error("Cadastro com Google indisponivel agora.");
    }
    const email = String(res.locals.user.email ?? body.email ?? "").trim().toLowerCase();
    const cpf = (0, comum_1.somenteNumeros)(body.cpf);
    const { data: cliente, error } = await supabase_1.supabaseAdmin
        .from("clientes")
        .insert({
        id_auth: res.locals.user.id,
        nome: body.name,
        cpf,
        telefone: body.phone,
        email,
        dt_nasc: body.birthDate,
    })
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    return { tipo: "cliente", perfil: cliente };
}
async function criarPerfilRestauranteGoogle(res, body) {
    if (!supabase_1.supabaseAdmin) {
        throw new Error("Cadastro com Google indisponivel agora.");
    }
    const cnpj = (0, comum_1.somenteNumeros)(body.cnpj);
    const cep = (0, comum_1.somenteNumeros)(body.cep);
    let validatedCnpj = {
        cnpj,
        razaoSocial: body.legalName,
        nomeFantasia: body.storeName,
        situacao: "",
    };
    let validatedCep = {
        cep,
        rua: body.address,
        bairro: body.neighborhood,
        cidade: body.city,
        estado: body.uf,
    };
    try {
        validatedCnpj = await (0, cnpj_1.consultarCnpjReceitaWs)(body.cnpj);
    }
    catch {
        validatedCnpj = {
            cnpj,
            razaoSocial: body.legalName,
            nomeFantasia: body.storeName,
            situacao: "",
        };
    }
    try {
        validatedCep = await (0, cep_1.consultarCepViaCep)(body.cep);
    }
    catch {
        validatedCep = {
            cep,
            rua: body.address,
            bairro: body.neighborhood,
            cidade: body.city,
            estado: body.uf,
        };
    }
    if (validatedCnpj.situacao &&
        validatedCnpj.situacao.toUpperCase() !== "ATIVA") {
        const erro = new Error(`O CNPJ informado esta com situacao ${validatedCnpj.situacao}.`);
        erro.statusCode = 400;
        throw erro;
    }
    const validatedAddressBody = {
        ...body,
        address: validatedCep.rua || body.address,
        neighborhood: validatedCep.bairro || body.neighborhood,
        city: validatedCep.cidade || body.city,
        uf: validatedCep.estado || body.uf,
    };
    const { data: restaurante, error } = await supabase_1.supabaseAdmin
        .from("restaurantes")
        .insert({
        id_auth: res.locals.user.id,
        nome: body.storeName,
        razao_social: body.legalName,
        cnpj: validatedCnpj.cnpj,
        telefone: body.phone,
        email: String(res.locals.user.email ?? body.email ?? "").trim().toLowerCase(),
        cep: validatedCep.cep,
        endereco: montarEndereco(validatedAddressBody.address, validatedAddressBody.number, validatedAddressBody.complement, validatedAddressBody.neighborhood, validatedAddressBody.city, validatedAddressBody.uf),
        horario_funcionamento: "A definir",
    })
        .select("*")
        .single();
    if (error) {
        throw new Error(error.message);
    }
    const quantidadeMesas = Math.max(Number.parseInt(String(body.tables), 10) || 0, 0);
    if (quantidadeMesas > 0) {
        const mesas = Array.from({ length: quantidadeMesas }, (_, index) => ({
            id_restaurante: restaurante.id_restaurante,
            numero_mesa: index + 1,
            capacidade: 4,
        }));
        const { error: mesasError } = await supabase_1.supabaseAdmin
            .from("mesas")
            .insert(mesas);
        if (mesasError) {
            throw new Error(mesasError.message);
        }
    }
    return { tipo: "restaurante", perfil: restaurante };
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
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Informe e-mail e senha." });
    }
    const { data, error } = await supabase_1.supabaseAuth.auth.signInWithPassword({
        email,
        password,
    });
    if (error || !data.session) {
        if (erroAutenticacaoEhInfraestrutura(error)) {
            return res.status(503).json({
                error: "Nao foi possivel acessar o servico de autenticacao. Verifique a conexao e tente novamente.",
            });
        }
        const mensagemErro = String(error?.message ?? "").toLowerCase();
        return res.status(401).json({
            error: mensagemErro.includes("email not confirmed")
                ? "Confirme seu e-mail antes de entrar."
                : "E-mail ou senha incorretos. Confira os dados cadastrados e tente novamente.",
        });
    }
    const profile = await obterPerfil(data.session.access_token, data.user.id);
    if (!profile) {
        return res.status(404).json({ error: "Perfil nao encontrado para este usuario." });
    }
    return res.json({
        ...profile,
        user: data.user,
        session: data.session,
    });
});
exports.authRouter.post("/google/client", auth_1.requireAuth, async (req, res) => {
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
        "phone",
    ]);
    if (missing) {
        return res.status(400).json({ error: missing });
    }
    if (!res.locals.user.email) {
        return res.status(400).json({ error: "A conta Google precisa possuir e-mail." });
    }
    if (!(0, cpf_1.validarCpf)(body.cpf)) {
        return res.status(400).json({ error: "Informe um CPF valido." });
    }
    try {
        const perfilExistente = await obterPerfilDoUsuarioAutenticado(res);
        if (perfilExistente) {
            return res.status(409).json({ error: "Esta conta Google ja possui perfil Appono." });
        }
        const profile = await criarPerfilClienteGoogle(res, body);
        return res.status(201).json({ ...profile, user: res.locals.user });
    }
    catch (error) {
        return res.status(error.statusCode ?? 400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel completar seu cadastro.",
        });
    }
});
exports.authRouter.post("/google/restaurant", auth_1.requireAuth, async (req, res) => {
    if (!(0, supabase_1.isSupabaseConfigured)()) {
        return res.status(503).json({
            error: "O cadastro esta temporariamente indisponivel. Tente novamente mais tarde.",
        });
    }
    const body = req.body;
    const missing = verificarCamposObrigatorios(body, [
        "storeName",
        "legalName",
        "phone",
        "cnpj",
        "cep",
        "address",
        "neighborhood",
        "city",
        "uf",
        "number",
        "tables",
    ]);
    if (missing) {
        return res.status(400).json({ error: missing });
    }
    if (!res.locals.user.email) {
        return res.status(400).json({ error: "A conta Google precisa possuir e-mail." });
    }
    const cnpj = (0, comum_1.somenteNumeros)(body.cnpj);
    const cep = (0, comum_1.somenteNumeros)(body.cep);
    if (!(0, cnpj_1.validarCnpj)(cnpj)) {
        return res.status(400).json({ error: "Informe um CNPJ valido." });
    }
    if (cep.length !== 8) {
        return res.status(400).json({ error: "Informe um CEP valido com 8 digitos." });
    }
    try {
        const perfilExistente = await obterPerfilDoUsuarioAutenticado(res);
        if (perfilExistente) {
            return res.status(409).json({ error: "Esta conta Google ja possui perfil Appono." });
        }
        const profile = await criarPerfilRestauranteGoogle(res, body);
        return res.status(201).json({ ...profile, user: res.locals.user });
    }
    catch (error) {
        return res.status(error.statusCode ?? 400).json({
            error: error instanceof Error ? error.message : "Nao foi possivel completar o cadastro do restaurante.",
        });
    }
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
        const status = erroAutenticacaoEhInfraestrutura(authError) ? 503 : 400;
        return res.status(status).json({ error: obterMensagemErroAutenticacao(authError?.message) });
    }
    if (!authData.session) {
        const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(authData.user.id, body.email, body.password);
        if (confirmedAuthData?.session) {
            const profile = await obterPerfil(confirmedAuthData.session.access_token, confirmedAuthData.user.id);
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
    const profile = await obterPerfil(authData.session.access_token, authData.user.id);
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
    const cnpj = (0, comum_1.somenteNumeros)(body.cnpj);
    const cep = (0, comum_1.somenteNumeros)(body.cep);
    if (!(0, cnpj_1.validarCnpj)(cnpj)) {
        return res.status(400).json({ error: "Informe um CNPJ valido." });
    }
    if (cep.length !== 8) {
        return res.status(400).json({ error: "Informe um CEP valido com 8 digitos." });
    }
    let validatedCnpj = {
        cnpj,
        razaoSocial: body.legalName,
        nomeFantasia: body.storeName,
        situacao: "",
    };
    let validatedCep = {
        cep,
        rua: body.address,
        bairro: body.neighborhood,
        cidade: body.city,
        estado: body.uf,
    };
    try {
        validatedCnpj = await (0, cnpj_1.consultarCnpjReceitaWs)(body.cnpj);
    }
    catch {
        validatedCnpj = {
            cnpj,
            razaoSocial: body.legalName,
            nomeFantasia: body.storeName,
            situacao: "",
        };
    }
    try {
        validatedCep = await (0, cep_1.consultarCepViaCep)(body.cep);
    }
    catch {
        validatedCep = {
            cep,
            rua: body.address,
            bairro: body.neighborhood,
            cidade: body.city,
            estado: body.uf,
        };
    }
    if (validatedCnpj.situacao &&
        validatedCnpj.situacao.toUpperCase() !== "ATIVA") {
        return res.status(400).json({
            error: `O CNPJ informado esta com situacao ${validatedCnpj.situacao}.`,
        });
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
                },
            },
        },
    });
    if (authError || !authData.user) {
        const status = erroAutenticacaoEhInfraestrutura(authError) ? 503 : 400;
        return res.status(status).json({ error: obterMensagemErroAutenticacao(authError?.message) });
    }
    if (!authData.session) {
        const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(authData.user.id, body.email, body.password);
        if (confirmedAuthData?.session) {
            const profile = await obterPerfil(confirmedAuthData.session.access_token, confirmedAuthData.user.id);
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
    const profile = await obterPerfil(authData.session.access_token, authData.user.id);
    return res.status(201).json({
        ...profile,
        user: authData.user,
        session: authData.session,
    });
});
