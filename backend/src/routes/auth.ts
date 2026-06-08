import { Router } from "express";
import {
  createUserSupabaseClient,
  isSupabaseConfigured,
  supabaseAdmin,
  supabaseAuth,
} from "../lib/supabase";

type ClientRegistrationBody = {
  name?: string;
  birthDate?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
};

type RestaurantRegistrationBody = {
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

function requireFields(body: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => !body[field]);
  return missing.length ? `Campos obrigatorios ausentes: ${missing.join(", ")}` : null;
}

function buildAddress(body: RestaurantRegistrationBody) {
  return [
    body.address,
    body.number,
    body.complement,
    body.neighborhood,
    body.city,
    body.uf,
  ]
    .filter(Boolean)
    .join(", ");
}

function getEmailRedirectUrl() {
  return `${frontendOrigin}/auth/callback`;
}

function getAuthErrorMessage(message?: string) {
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

async function getProfile(accessToken: string) {
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

async function confirmAndSignInCreatedUser(
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

  const profile = await getProfile(data.session.access_token);

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
  const missing = requireFields(body, [
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

  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: body.email!,
    password: body.password!,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      data: {
        appono_profile: {
          tipo: "cliente",
          nome: body.name,
          cpf: body.cpf,
          telefone: body.phone,
          email: body.email,
          dt_nasc: body.birthDate,
        },
      },
    },
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: getAuthErrorMessage(authError?.message) });
  }

  if (!authData.session) {
    const confirmedAuthData = await confirmAndSignInCreatedUser(
      authData.user.id,
      body.email!,
      body.password!,
    );

    if (confirmedAuthData?.session) {
      const profile = await getProfile(confirmedAuthData.session.access_token);

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

  const profile = await getProfile(authData.session.access_token);

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
  const missing = requireFields(body, [
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

  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: body.email!,
    password: body.password!,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      data: {
        appono_profile: {
          tipo: "restaurante",
          nome: body.legalName,
          cnpj: body.cnpj,
          telefone: body.phone,
          email: body.email,
          cep: body.cep,
          endereco: buildAddress(body),
          horario_funcionamento: "A definir",
          quantidade_mesas: body.tables,
          dados_bancarios: {
            cod_banco: body.bankCode,
            agencia: body.agency,
            conta_corrente: body.checkingAccount,
            chave_pix: body.pixKey,
          },
        },
      },
    },
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: getAuthErrorMessage(authError?.message) });
  }

  if (!authData.session) {
    const confirmedAuthData = await confirmAndSignInCreatedUser(
      authData.user.id,
      body.email!,
      body.password!,
    );

    if (confirmedAuthData?.session) {
      const profile = await getProfile(confirmedAuthData.session.access_token);

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

  const profile = await getProfile(authData.session.access_token);

  return res.status(201).json({
    ...profile,
    user: authData.user,
    session: authData.session,
  });
});
