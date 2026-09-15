"use strict";

const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const app = require("../../src/server");
const { createUserSupabaseClient, supabaseAdmin, supabaseAuth } = require("../../src/lib/supabase");

if (process.env.APPONO_REMOTE_SMOKE !== "confirmado") {
    throw new Error("Defina APPONO_REMOTE_SMOKE=confirmado para executar este teste descartável.");
}
if (!supabaseAdmin) throw new Error("SUPABASE_SECRET_KEY não configurada.");

const criados = [];
const resultados = [];
let server;

function registrar(nome, detalhe = "ok") {
    resultados.push({ nome, detalhe });
}

function cpfValido(seed) {
    const base = String(seed).replace(/\D/g, "").padStart(9, "1").slice(-9).split("").map(Number);
    for (const peso of [10, 11]) {
        const soma = base.reduce((total, digito, indice) => total + digito * (peso - indice), 0);
        const resto = (soma * 10) % 11;
        base.push(resto === 10 ? 0 : resto);
    }
    return base.join("");
}

async function criarCliente(indice) {
    const sufixo = `${Date.now()}-${indice}-${randomBytes(3).toString("hex")}`;
    const email = `smoke-rotina-${sufixo}@example.com`;
    const password = `Appono!${randomBytes(14).toString("base64url")}`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            appono_profile: {
                tipo: "cliente",
                nome: `Smoke Rotina ${indice}`,
                cpf: cpfValido(`${Date.now()}${indice}`),
                telefone: "11999999999",
                email,
                dt_nasc: "1995-05-15",
            },
        },
    });
    if (error || !data.user) throw new Error(`Falha ao criar cliente descartável: ${error?.message ?? "sem usuário"}`);
    criados.push(data.user.id);
    const { data: sessao, error: loginError } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (loginError || !sessao.session) throw new Error(`Falha no login descartável: ${loginError?.message ?? "sem sessão"}`);
    const { data: cliente, error: clienteError } = await supabaseAdmin.from("clientes")
        .select("id_cliente").eq("id_auth", data.user.id).single();
    if (clienteError) throw new Error(`Perfil descartável ausente: ${clienteError.message}`);
    return { authId: data.user.id, id: cliente.id_cliente, token: sessao.session.access_token };
}

async function limpar() {
    for (const authId of [...criados].reverse()) {
        const { error: profileError } = await supabaseAdmin.from("clientes").delete().eq("id_auth", authId);
        if (profileError) console.error(`CLEANUP_PROFILE_FAILED:${authId}:${profileError.code ?? "unknown"}`);
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(authId);
        if (authError) console.error(`CLEANUP_AUTH_FAILED:${authId}:${authError.message}`);
    }
}

async function request(base, rota, token, options = {}) {
    const response = await fetch(`${base}/api/rotina${rota}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
}

async function executar() {
    server = await new Promise((resolve) => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const [clienteA, clienteB] = await Promise.all([criarCliente(1), criarCliente(2)]);
    registrar("cadastro e login", "2 clientes temporários autenticados");

    const semToken = await request(base, "/perfil", null);
    assert.equal(semToken.status, 401);
    registrar("autenticação HTTP", "acesso sem JWT negado");

    const vazio = await request(base, "/perfil", clienteA.token);
    assert.equal(vazio.status, 200);
    assert.equal(vazio.body, null);

    const perfilBase = {
        versao_perfil: 0,
        nome: "Rotina Smoke",
        endereco_base: "Base de teste descartável",
        latitude: 0,
        longitude: 0,
        dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        horario_inicio: "11:30",
        horario_fim: "14:00",
        tempo_maximo_minutos: 60,
        orcamento_diario: 80,
        orcamento_semanal: 400,
        raio_km: 1,
        preferencias: ["Massa"],
        restricoes: [],
        alergias: [],
        restaurantes_favoritos_rotina: [],
        pratos_favoritos_rotina: [],
    };
    const [perfilA, perfilB] = await Promise.all([
        request(base, "/perfil", clienteA.token, { method: "POST", body: JSON.stringify(perfilBase) }),
        request(base, "/perfil", clienteB.token, { method: "POST", body: JSON.stringify(perfilBase) }),
    ]);
    assert.equal(perfilA.status, 201, JSON.stringify(perfilA.body));
    assert.equal(perfilB.status, 201, JSON.stringify(perfilB.body));
    assert.equal(perfilA.body.versao, 1);
    registrar("salvamento transacional", "perfil e preferências persistidos");

    const concorrentes = await Promise.all([
        request(base, "/perfil", clienteA.token, { method: "PATCH", body: JSON.stringify({ versao_perfil: 1, nome: "Aba A" }) }),
        request(base, "/perfil", clienteA.token, { method: "PATCH", body: JSON.stringify({ versao_perfil: 1, nome: "Aba B" }) }),
    ]);
    assert.deepEqual(concorrentes.map((item) => item.status).sort(), [200, 409]);
    const atualizado = await request(base, "/perfil", clienteA.token);
    assert.equal(atualizado.body.versao, 2);
    assert.ok(["Aba A", "Aba B"].includes(atualizado.body.nome));
    registrar("concorrência de perfil", "uma aba aceita e outra recebe HTTP 409");

    const userB = createUserSupabaseClient(clienteB.token);
    const { data: cruzado, error: cruzadoError } = await userB.from("perfis_rotina_cliente")
        .select("id_perfil_rotina").eq("id_cliente", clienteA.id);
    assert.equal(cruzadoError, null);
    assert.deepEqual(cruzado, []);
    const { error: escritaDireta } = await userB.from("perfis_rotina_cliente")
        .update({ nome: "Tentativa indevida" }).eq("id_cliente", clienteB.id);
    assert.ok(escritaDireta);
    registrar("RLS e privilégios", "leitura cruzada vazia e escrita direta negada");

    const payloadGeracao = { versao_perfil: 2, versao_planejamento: 0 };
    const geracoes = await Promise.all([
        request(base, "/planejamento/gerar", clienteA.token, { method: "POST", body: JSON.stringify(payloadGeracao) }),
        request(base, "/planejamento/gerar", clienteA.token, { method: "POST", body: JSON.stringify(payloadGeracao) }),
    ]);
    assert.deepEqual(geracoes.map((item) => item.status).sort(), [201, 409], JSON.stringify(geracoes));
    const gerada = geracoes.find((item) => item.status === 201).body;
    assert.equal(gerada.planejamento.versao, 1);
    assert.ok(Array.isArray(gerada.refeicoes));
    registrar("primeira geração concorrente", "uma geração aceita e outra recebe HTTP 409");

    const aprovacao = await request(base, `/planejamento/${gerada.planejamento.id_planejamento_rotina}/aprovar`, clienteA.token, {
        method: "POST",
        body: JSON.stringify({ versao_perfil: 2, versao_planejamento: 1 }),
    });
    assert.equal(aprovacao.status, 200, JSON.stringify(aprovacao.body));
    assert.equal(aprovacao.body.planejamento.status, "APROVADO");
    assert.equal(aprovacao.body.planejamento.versao, 2);
    registrar("aprovação transacional", "planejamento aprovado com versão incrementada");

    const { data: planoCruzado, error: planoCruzadoError } = await userB.from("planejamentos_rotina")
        .select("id_planejamento_rotina").eq("id_cliente", clienteA.id);
    assert.equal(planoCruzadoError, null);
    assert.deepEqual(planoCruzado, []);
    registrar("propriedade do planejamento", "segundo cliente não lê a semana do primeiro");
}

(async () => {
    try {
        await executar();
        console.log(JSON.stringify({ ok: true, checks: resultados }, null, 2));
    } catch (error) {
        console.error(JSON.stringify({ ok: false, checks: resultados, error: error.message }, null, 2));
        process.exitCode = 1;
    } finally {
        await limpar();
        if (server) await new Promise((resolve) => server.close(resolve));
    }
})();
