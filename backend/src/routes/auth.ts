import { Router } from "express";
import {
  createUserSupabaseClient,
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

function requireFields(body: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => !body[field]);

  if (missing.length) {
    return `Campos obrigatorios ausentes: ${missing.join(", ")}`;
  }

  return null;
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

function parseTableCount(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

async function insertProfileWithUserSession(
  accessToken: string,
  table: "clientes" | "restaurantes",
  payload: Record<string, unknown>,
) {
  const supabase = createUserSupabaseClient(accessToken);
  return supabase.from(table).insert(payload).select("*").single();
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  return res.json({
    user: data.user,
    session: data.session,
  });
});

authRouter.post("/register/client", async (req, res) => {
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
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message ?? "Erro ao criar usuario." });
  }

  const profile = {
    id_auth: authData.user.id,
    nome: body.name,
    cpf: body.cpf,
    telefone: body.phone,
    email: body.email,
    dt_nasc: body.birthDate,
  };

  if (authData.session) {
    const { data, error } = await insertProfileWithUserSession(
      authData.session.access_token,
      "clientes",
      profile,
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      tipo: "cliente",
      perfil: data,
      session: authData.session,
      user: authData.user,
    });
  }

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("clientes")
      .insert(profile)
      .select("*")
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      tipo: "cliente",
      perfil: data,
      session: null,
      user: authData.user,
    });
  }

  return res.status(202).json({
    user: authData.user,
    session: null,
    message:
      "Usuario criado. Confirme o e-mail antes de continuar ou configure SUPABASE_SECRET_KEY no backend para criar o perfil automaticamente.",
  });
});

authRouter.post("/register/restaurant", async (req, res) => {
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
  });

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message ?? "Erro ao criar usuario." });
  }

  const restaurantProfile = {
    id_auth: authData.user.id,
    nome: body.legalName,
    cnpj: body.cnpj,
    telefone: body.phone,
    email: body.email,
    cep: body.cep,
    endereco: buildAddress(body),
    horario_funcionamento: "A definir",
  };

  const accessToken = authData.session?.access_token;
  const writer = accessToken ? createUserSupabaseClient(accessToken) : supabaseAdmin;

  if (!writer) {
    return res.status(202).json({
      user: authData.user,
      session: null,
      message:
        "Usuario criado. Confirme o e-mail antes de continuar ou configure SUPABASE_SECRET_KEY no backend para criar o perfil automaticamente.",
    });
  }

  const { data: restaurante, error: restaurantError } = await writer
    .from("restaurantes")
    .insert(restaurantProfile)
    .select("*")
    .single();

  if (restaurantError) {
    return res.status(400).json({ error: restaurantError.message });
  }

  const bankFieldsWereFilled =
    body.bankCode || body.agency || body.checkingAccount || body.pixKey;

  if (bankFieldsWereFilled) {
    const { error: bankError } = await writer.from("dados_bancarios_restaurante").insert({
      id_restaurante: restaurante.id_restaurante,
      cod_banco: body.bankCode || null,
      agencia: body.agency || null,
      conta_corrente: body.checkingAccount || null,
      chave_pix: body.pixKey || null,
    });

    if (bankError) {
      return res.status(400).json({ error: bankError.message });
    }
  }

  const tableCount = parseTableCount(body.tables);

  if (tableCount > 0) {
    const mesas = Array.from({ length: tableCount }, (_, index) => ({
      id_restaurante: restaurante.id_restaurante,
      numero_mesa: index + 1,
      capacidade: 4,
    }));

    const { error: tablesError } = await writer.from("mesas").insert(mesas);

    if (tablesError) {
      return res.status(400).json({ error: tablesError.message });
    }
  }

  return res.status(201).json({
    tipo: "restaurante",
    perfil: restaurante,
    session: authData.session,
    user: authData.user,
  });
});
