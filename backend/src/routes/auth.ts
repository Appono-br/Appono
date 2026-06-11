import { Router } from "express";
import {
  createUserSupabaseClient,
  isSupabaseConfigured,
  supabaseAdmin,
  supabaseAuth,
} from "../lib/supabase";
import { consultarCepViaCep } from "../services/validacoes/cep";
import { consultarCnpjReceitaWs } from "../services/validacoes/cnpj";
import { somenteNumeros } from "../services/validacoes/comum";
import { validarCpf } from "../services/validacoes/cpf";
import { validarDadosBancarios } from "../services/validacoes/dados-bancarios";

type ClientRegistrationBody = {
  name?: string;
  birthDate?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
};

type RestaurantRegistrationBody = {
  storeName?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
  number?: string;
  complement?: string;
  tables?: string;
  bankCode?: string;
  agency?: string;
  checkingAccount?: string;
  pixKey?: string;
  password?: string;
};

export const authRouter = Router();

const frontendOrigin = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

function verificarCamposObrigatorios(body: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => !body[field]);
  return missing.length ? `Campos obrigatorios ausentes: ${missing.join(", ")}` : null;
}

function montarEndereco(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function obterUrlRedirecionamentoEmail() {
  return `${frontendOrigin}/auth/callback`;
}

function obterMensagemErroAutenticacao(message?: string) {
  if (!message) {
    return "Erro ao criar usuario.";
  }

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("email rate limit exceeded") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("limite de envio")
  ) {
    return "Limite temporario de envio de e-mails atingido. Aguarde alguns minutos ou tente novamente mais tarde.";
  }

  return message;
}

async function obterPerfil(accessToken: string) {
  const supabase = createUserSupabaseClient(accessToken);

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("*")
    .maybeSingle();

  if (clienteError) {
    throw new Error(clienteError.message);
  }

  if (cliente) {
    return { tipo: "cliente" as const, perfil: cliente };
  }

  const { data: restaurante, error: restauranteError } = await supabase
    .from("restaurantes")
    .select("*")
    .maybeSingle();

  if (restauranteError) {
    throw new Error(restauranteError.message);
  }

  if (restaurante) {
    return { tipo: "restaurante" as const, perfil: restaurante };
  }

  return null;
}

async function confirmarEEntrarComUsuarioCriado(
  userId: string,
  email: string,
  password: string,
) {
  if (!supabaseAdmin) {
    return null;
  }

  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { email_confirm: true },
  );

  if (confirmError) {
    throw new Error("Nao foi possivel ativar sua conta agora.");
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error("Conta criada. Entre com seu e-mail e senha.");
  }

  return data;
}

authRouter.post("/login", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "O acesso esta temporariamente indisponivel. Tente novamente mais tarde.",
    });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({
      error:
        error?.message.toLowerCase().includes("email not confirmed")
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

authRouter.post("/register/client", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "O cadastro esta temporariamente indisponivel. Tente novamente mais tarde.",
    });
  }

  const body = req.body as ClientRegistrationBody;
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

  if (!validarCpf(body.cpf)) {
    return res.status(400).json({ error: "Informe um CPF valido." });
  }

  const cpf = somenteNumeros(body.cpf);

  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: body.email!,
    password: body.password!,
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
    const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(
      authData.user.id,
      body.email!,
      body.password!,
    );

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

authRouter.post("/register/restaurant", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "O cadastro esta temporariamente indisponivel. Tente novamente mais tarde.",
    });
  }

  const body = req.body as RestaurantRegistrationBody;
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
      consultarCnpjReceitaWs(body.cnpj),
      consultarCepViaCep(body.cep),
    ]);
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel validar os dados do restaurante.",
    });
  }

  if (
    validatedCnpj.situacao &&
    validatedCnpj.situacao.toUpperCase() !== "ATIVA"
  ) {
    return res.status(400).json({
      error: `O CNPJ informado esta com situacao ${validatedCnpj.situacao}.`,
    });
  }

  const bankError = validarDadosBancarios(body);

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

  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: body.email!,
    password: body.password!,
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
          endereco: montarEndereco(
            validatedAddressBody.address,
            validatedAddressBody.number,
            validatedAddressBody.complement,
            validatedAddressBody.neighborhood,
            validatedAddressBody.city,
            validatedAddressBody.uf,
          ),
          horario_funcionamento: "A definir",
          quantidade_mesas: body.tables,
          dados_bancarios: {
            cod_banco: somenteNumeros(body.bankCode),
            agencia: somenteNumeros(body.agency),
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
    const confirmedAuthData = await confirmarEEntrarComUsuarioCriado(
      authData.user.id,
      body.email!,
      body.password!,
    );

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
