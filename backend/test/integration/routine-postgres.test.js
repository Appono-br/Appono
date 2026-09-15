"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

// No .env loading. Never accepts a remote host or a shared database name.
const psql = process.env.APPONO_ROUTINE_PSQL;
const port = Number(process.env.APPONO_ROUTINE_TEST_PORT);
if (!psql || process.env.APPONO_ROUTINE_TEST_CLUSTER !== "isolated" || !Number.isInteger(port) || port < 1024 || port === 5432) {
    throw new Error("Informe APPONO_ROUTINE_PSQL, APPONO_ROUTINE_TEST_PORT e APPONO_ROUTINE_TEST_CLUSTER=isolated para um cluster descartavel local.");
}
const database = `appono_routine_test_${process.pid}`;
const root = path.resolve(__dirname, "../../..");
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;
function query(sql, db = database, onData = null) {
    return new Promise((resolve, reject) => {
        const child = spawn(psql, ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-h", "127.0.0.1", "-p", String(port), "-U", "postgres", "-d", db], {
            windowsHide: true, env: { ...process.env, PGCONNECT_TIMEOUT: "5", PGOPTIONS: "-c statement_timeout=10000 -c lock_timeout=5000" },
        });
        let stdout = ""; let stderr = "";
        child.stdout.on("data", (data) => { stdout += data; onData?.(stdout); });
        child.stderr.on("data", (data) => { stderr += data; });
        child.on("error", reject);
        child.on("close", (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr)));
        child.stdin.end(sql);
    });
}
const file = (name) => readFileSync(path.join(root, name), "utf8");
const migration = "supabase/migrations/20260913220856_routine_transaction_integrity.sql";
let created = false;
before(async () => {
    await query(`create database ${database};`, "postgres"); created = true;
    await query(`do $$ begin
      if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
      if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
    end $$;`);
    await query(file("backend/test/integration/routine-fixture.sql"));
    for (const name of ["20260803000400_add_reservation_check_in_status.sql", "20260901000100_remove_preparation_time_from_orders.sql", "20260817000100_pending_reservation_until_order_payment.sql", "20260912000200_create_appono_routine.sql"]) {
        await query(file(`supabase/migrations/${name}`));
    }
    // Exercise preflight against incompatible legacy data before installation.
    const actor = randomUUID();
    await query(`insert into clientes(id_auth) values(${quote(actor)});
      insert into perfis_rotina_cliente(id_cliente,tempo_maximo_minutos) select id_cliente,20 from clientes where id_auth=${quote(actor)};`);
    await assert.rejects(query(file(migration)), /Perfis de rotina incompativeis/);
    assert.equal(await query("select count(*) from information_schema.columns where table_name='perfis_rotina_cliente' and column_name='versao';"), "0");
    // This fixture is synthetic; explicit correction is part of this test only.
    await query("update perfis_rotina_cliente set tempo_maximo_minutos=60;");
    await query(file(migration));
});
after(async () => { if (created) await query(`drop database ${database} with (force);`, "postgres"); });

function mutation(ctx, op, pv, wv = null, id = null, data = {}) {
    return `set role service_role; select public.mutar_rotina(${quote(ctx.actor)},${quote(op)},${pv},${wv ?? "null"},${id ?? "null"},${json(data)});`;
}
async function mutate(...args) { return JSON.parse(await query(mutation(...args))); }
function conversion(ctx, meal, pv, wv, paid = false) {
    return `set role authenticated; set request.jwt.claim.sub=${quote(ctx.actor)};
      select public.converter_refeicao_rotina(${meal},${paid},${pv},${wv});`;
}
async function fixture() {
    const ctx = { actor: randomUUID() };
    ctx.client = Number(await query(`insert into clientes(id_auth) values(${quote(ctx.actor)}) returning id_cliente;`));
    const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    ctx.restaurant = Number(await query(`insert into restaurantes(nome,configuracao_operacao) values('Restaurante teste',${json({ days: days.map((id) => ({ id, enabled: true, shifts: [{ open: "08:00", close: "22:00" }] })), antecedenciaMinutosReserva: 0 })}) returning id_restaurante;`));
    ctx.product = Number(await query(`insert into produtos(id_restaurante,nome,preco) values(${ctx.restaurant},'Prato teste',25) returning id_produto;`));
    await query(`insert into mesas(id_restaurante,numero_mesa,capacidade) values(${ctx.restaurant},1,4);`);
    const start = new Date(); start.setUTCDate(start.getUTCDate() + 14);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    const end = new Date(start); end.setUTCDate(start.getUTCDate()+6);
    ctx.week = { semana_inicio: start.toISOString().slice(0,10), semana_fim: end.toISOString().slice(0,10) };
    ctx.meal = { id_restaurante: ctx.restaurant, id_produto: ctx.product, data_refeicao: ctx.week.semana_inicio,
        dia_semana: "monday", horario_sugerido: "12:00", preco_estimado: 25, distancia_km: 1, tempo_estimado_minutos: 50, pontuacao: 60 };
    ctx.generated = { ...ctx.week, refeicoes: [ctx.meal], resumo: { modelo: "fixture" } };
    await mutate(ctx,"PERFIL",0,null,null,{ nome:"Rotina teste", horario_inicio:"11:30",horario_fim:"14:00",tempo_maximo_minutos:60,
        orcamento_semanal:100, preferencias:["Massa"], restricoes:["Carne"], restaurantes_favoritos_rotina:[ctx.restaurant] });
    return ctx;
}
async function snapshot(ctx) {
    return query(`select jsonb_build_object(
      'perfil',(select jsonb_agg(to_jsonb(p) order by id_perfil_rotina) from perfis_rotina_cliente p where id_cliente=${ctx.client}),
      'preferencias',(select jsonb_agg(to_jsonb(p) order by id_preferencia_rotina) from preferencias_rotina_cliente p where id_cliente=${ctx.client}),
      'restricoes',(select jsonb_agg(to_jsonb(p) order by id_restricao_rotina) from restricoes_rotina_cliente p where id_cliente=${ctx.client}),
      'planos',(select jsonb_agg(to_jsonb(p) order by id_planejamento_rotina) from planejamentos_rotina p where id_cliente=${ctx.client}),
      'refeicoes',(select jsonb_agg(to_jsonb(p) order by id_refeicao_planejada) from refeicoes_planejadas p where id_cliente=${ctx.client}),
      'historico',(select jsonb_agg(to_jsonb(p) order by id_historico_rotina) from historico_rotina_cliente p where id_cliente=${ctx.client}),
      'reservas',(select jsonb_agg(to_jsonb(p) order by id_reserva) from reservas p where id_cliente=${ctx.client}),
      'pedidos',(select jsonb_agg(to_jsonb(p) order by id_pedido) from pedidos p where id_cliente=${ctx.client}));`);
}
async function race(first, second) {
    let ready;
    const held = new Promise((resolve) => { ready = resolve; });
    const a = query(`begin; ${first} select 'LOCK_HELD'; select pg_sleep(1.5); commit;`, database,
        (out) => { if (out.includes("LOCK_HELD")) ready(); });
    a.catch(() => ready());
    await held;
    const b = query(`set application_name='routine-race-second'; ${second}`);
    // Verify that the second connection really waits on the advisory lock.
    const joined = Promise.allSettled([a,b]);
    let waiting = false;
    for (let attempt=0;attempt<10;attempt++) {
        if (await query("select count(*) from pg_stat_activity where application_name='routine-race-second' and wait_event='advisory';") === "1") { waiting=true; break; }
    }
    const results = await joined;
    assert.ok(waiting,"A segunda conexao deve aguardar o lock transacional real");
    assert.equal(results[0].status,"fulfilled",results[0].reason?.message);
    assert.equal(results[1].status,"rejected");
    assert.match(results[1].reason.message,/PT409|PT404/);
}

test("PostgreSQL: perfil, selecoes e auditoria fazem rollback em falha intermediaria", async () => {
    const ctx = await fixture(); const original = await snapshot(ctx);
    await assert.rejects(mutate(ctx,"PERFIL",1,null,null,{nome:"Nao persistir",preferencias:["Peixe"],restaurantes_favoritos_rotina:[999999999]}),/23503/);
    assert.equal(await snapshot(ctx),original);
});
test("PostgreSQL: falha da auditoria desfaz toda a operacao", async () => {
    const ctx = await fixture(); const original = await snapshot(ctx);
    await query(`create function falha_auditoria_teste() returns trigger language plpgsql as $$ begin
      if new.id_cliente=${ctx.client} then raise exception 'AUDIT_FAILURE'; end if; return new; end $$;
      create trigger falha_auditoria before insert on historico_rotina_cliente for each row execute function falha_auditoria_teste();`);
    try {
        await assert.rejects(mutate(ctx,"PERFIL",1,null,null,{nome:"Nao persistir"}),/AUDIT_FAILURE/);
        assert.equal(await snapshot(ctx),original);
    } finally { await query("drop trigger falha_auditoria on historico_rotina_cliente; drop function falha_auditoria_teste();"); }
});
test("PostgreSQL: PATCH preserva omitidos, [] remove e null limpa apenas opcionais", async () => {
    const ctx = await fixture();
    const saved = await mutate(ctx,"PERFIL",1,null,null,{endereco_base:"Base teste",preferencias:[]});
    assert.equal(saved.restricoes.length,1);
    assert.equal(saved.preferencias.filter((p)=>p.tipo==="PREFERENCIA").length,0);
    assert.equal(saved.preferencias.filter((p)=>p.tipo==="RESTAURANTE_FAVORITO").length,1);
    const cleared = await mutate(ctx,"PERFIL",2,null,null,{endereco_base:null,orcamento_semanal:null});
    assert.equal(cleared.perfil.endereco_base,null); assert.equal(cleared.perfil.orcamento_semanal,null);
    for (const data of [{nome:null},{preferencias:null},{dias_semana:null}]) await assert.rejects(mutate(ctx,"PERFIL",3,null,null,data));
});
test("PostgreSQL: constraints temporais, dias, raio, coordenadas e orcamentos", async () => {
    const ctx = await fixture(); const original = await snapshot(ctx);
    for (const data of [{tempo_maximo_minutos:29},{tempo_maximo_minutos:241},{tempo_maximo_minutos:60.5},
        {horario_inicio:"14:00",horario_fim:"12:00"},{horario_inicio:"12:00",horario_fim:"12:30",tempo_maximo_minutos:60},
        {dias_semana:[]},{dias_semana:["invalid"]},{dias_semana:[null]},{raio_km:0},{raio_km:101},
        {latitude:91,longitude:0},{latitude:0},{latitude:0,longitude:181},{orcamento_diario:-1},{orcamento_semanal:-1},{orcamento_diario:"NaN"}]) {
        await assert.rejects(mutate(ctx,"PERFIL",1,null,null,data),undefined,JSON.stringify(data));
        assert.equal(await snapshot(ctx),original);
    }
});
test("PostgreSQL: duas abas salvando a mesma versao geram um conflito", async () => {
    const ctx = await fixture();
    await race(mutation(ctx,"PERFIL",1,null,null,{nome:"Primeira aba"}),mutation(ctx,"PERFIL",1,null,null,{nome:"Segunda aba"}));
    assert.equal(JSON.parse(await snapshot(ctx)).perfil[0].nome,"Primeira aba");
});
test("PostgreSQL: falha apos excluir sugestoes preserva planejamento anterior", async () => {
    const ctx = await fixture(); await mutate(ctx,"GERAR",1,0,null,ctx.generated); const original=await snapshot(ctx);
    await assert.rejects(mutate(ctx,"GERAR",1,1,null,{...ctx.generated,refeicoes:[{...ctx.meal,id_produto:999999999}]}),/23503/);
    assert.equal(await snapshot(ctx),original);
});
test("PostgreSQL: primeira geracao e regeneracoes simultaneas sao serializadas", async () => {
    const ctx=await fixture();
    await race(mutation(ctx,"GERAR",1,0,null,ctx.generated),mutation(ctx,"GERAR",1,0,null,ctx.generated));
    await race(mutation(ctx,"GERAR",1,1,null,ctx.generated),mutation(ctx,"GERAR",1,1,null,ctx.generated));
    const saved=JSON.parse(await snapshot(ctx)); assert.equal(saved.planos.length,1); assert.equal(saved.refeicoes.length,1); assert.equal(saved.planos[0].versao,2);
});
test("PostgreSQL: perfil alterado invalida sugestoes calculadas anteriormente", async () => {
    const ctx=await fixture(); await mutate(ctx,"PERFIL",1,null,null,{raio_km:2});
    await assert.rejects(mutate(ctx,"GERAR",1,0,null,ctx.generated),/PT409/);
});
test("PostgreSQL: perfil novo exige regeneracao antes de converter sugestao antiga", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated);
    await mutate(ctx,"PERFIL",1,null,null,{alergias:["Leite"]});
    await assert.rejects(query(conversion(ctx,plan.refeicoes[0].id_refeicao_planejada,2,1,true)),/Gere novas sugestoes/);
});
test("PostgreSQL: duas conversoes simultaneas criam uma unica reserva", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated); const id=plan.refeicoes[0].id_refeicao_planejada;
    await race(conversion(ctx,id,1,1),conversion(ctx,id,1,1));
    assert.equal(JSON.parse(await snapshot(ctx)).reservas.length,1);
});
test("PostgreSQL: conversao primeiro preserva vinculo durante regeneracao e limita saldo", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated); const id=plan.refeicoes[0].id_refeicao_planejada;
    await race(conversion(ctx,id,1,1),mutation(ctx,"GERAR",1,1,null,ctx.generated));
    const converted=JSON.parse(await snapshot(ctx)).refeicoes[0]; assert.ok(converted.id_reserva);
    const regenerated=await mutate(ctx,"GERAR",1,2,null,ctx.generated);
    assert.equal(regenerated.refeicoes[0].id_reserva,converted.id_reserva); assert.equal(regenerated.planejamento.resumo.custo_estimado_total,25);
    await assert.rejects(query(conversion(ctx,id,1,3)),/convertida/);
    await mutate(ctx,"PERFIL",1,null,null,{orcamento_semanal:30});
    const next=new Date(`${ctx.week.semana_inicio}T12:00:00Z`); next.setUTCDate(next.getUTCDate()+1);
    await assert.rejects(mutate(ctx,"GERAR",2,3,null,{...ctx.generated,refeicoes:[{...ctx.meal,data_refeicao:next.toISOString().slice(0,10),dia_semana:"tuesday"}]}),/orcamento semanal/);
    assert.equal(JSON.parse(await snapshot(ctx)).reservas.length,1);
});
test("PostgreSQL: regeneracao primeiro bloqueia conversao e edicao da refeicao removida", async () => {
    const ctx=await fixture(); let plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated);
    await race(mutation(ctx,"GERAR",1,1,null,ctx.generated),conversion(ctx,plan.refeicoes[0].id_refeicao_planejada,1,1));
    plan=JSON.parse(await snapshot(ctx));
    await race(mutation(ctx,"GERAR",1,2,null,ctx.generated),mutation(ctx,"EDITAR",1,2,plan.refeicoes[0].id_refeicao_planejada,ctx.meal));
    assert.equal(JSON.parse(await snapshot(ctx)).reservas,null);
});
test("PostgreSQL: edicao primeiro invalida regeneracao desatualizada", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated);
    await race(mutation(ctx,"EDITAR",1,1,plan.refeicoes[0].id_refeicao_planejada,{...ctx.meal,horario_sugerido:"12:30"}),mutation(ctx,"GERAR",1,1,null,ctx.generated));
    assert.equal(JSON.parse(await snapshot(ctx)).refeicoes[0].horario_sugerido,"12:30:00");
});
test("PostgreSQL: anonimo, escrita direta, RPC antiga e outro cliente bloqueados", async () => {
    const ctx=await fixture(); const other=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated); const id=plan.refeicoes[0].id_refeicao_planejada;
    await assert.rejects(query(`set role anon; select * from perfis_rotina_cliente;`),/42501/);
    await assert.rejects(query(mutation(ctx,"PERFIL",1).replace("service_role","authenticated")),/42501/);
    await assert.rejects(query(`set role authenticated; update perfis_rotina_cliente set versao=99;`),/42501/);
    await assert.rejects(query(`set role authenticated; select public.converter_refeicao_rotina(${id},false);`),/42883/);
    await assert.rejects(query(`set role authenticated; select appono_private.converter_refeicao_rotina_original(${id},false);`),/42501/);
    await assert.rejects(query(`set role anon; select public.converter_refeicao_rotina(${id},false,1,1);`),/42501/);
    await assert.rejects(query(`set role authenticated; select public.converter_refeicao_rotina(${id},false,1,1);`),/42501/);
    await assert.rejects(query(conversion(other,id,1,1)),/PT404/);
    await assert.rejects(mutate(other,"EDITAR",1,1,id,ctx.meal),/PT404/);
    await assert.rejects(mutate({actor:randomUUID()},"PERFIL",0),/42501/);
    for (const table of ['perfis_rotina_cliente','preferencias_rotina_cliente','restricoes_rotina_cliente','planejamentos_rotina','refeicoes_planejadas','historico_rotina_cliente']) {
        assert.equal(await query(`set role authenticated; set request.jwt.claim.sub=${quote(other.actor)};
          select count(*) from ${table} where id_cliente=${ctx.client};`),"0");
        assert.equal(await query(`select relrowsecurity and not has_table_privilege('authenticated',oid,'INSERT,UPDATE,DELETE') from pg_class where oid='${table}'::regclass;`),"t");
    }
});
test("PostgreSQL: aprovacao da semana e auditoria sao atomicas", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated); const original=await snapshot(ctx);
    await query(`create function falha_aprovacao_teste() returns trigger language plpgsql as $$ begin
      if new.id_cliente=${ctx.client} then raise exception 'AUDIT_APPROVAL_FAILURE'; end if; return new; end $$;
      create trigger falha_aprovacao before insert on historico_rotina_cliente for each row execute function falha_aprovacao_teste();`);
    try {
        await assert.rejects(mutate(ctx,"APROVAR_PLANO",1,1,plan.planejamento.id_planejamento_rotina),/AUDIT_APPROVAL_FAILURE/);
        assert.equal(await snapshot(ctx),original);
    } finally { await query("drop trigger falha_aprovacao on historico_rotina_cliente; drop function falha_aprovacao_teste();"); }
    const approved=await mutate(ctx,"APROVAR_PLANO",1,1,plan.planejamento.id_planejamento_rotina);
    assert.equal(approved.planejamento.status,"APROVADO"); assert.equal(approved.refeicoes[0].status,"APROVADA");
    assert.equal(approved.planejamento.versao,2);
});
test("PostgreSQL: reserva simples confirmada, pedido pendente e itens reais", async () => {
    const simple=await fixture(); let plan=await mutate(simple,"GERAR",1,0,null,simple.generated);
    const reserva=JSON.parse(await query(conversion(simple,plan.refeicoes[0].id_refeicao_planejada,1,1)));
    assert.equal(reserva.reserva.status_reserva,"CONFIRMADA");
    const paid=await fixture(); plan=await mutate(paid,"GERAR",1,0,null,paid.generated);
    await query(`update produtos set preco=35 where id_produto=${paid.product};`);
    const result=JSON.parse(await query(conversion(paid,plan.refeicoes[0].id_refeicao_planejada,1,1,true)));
    assert.equal(result.reserva.status_reserva,"PENDENTE"); assert.equal(result.pedido.status_pedido,"PENDENTE");
    assert.equal(result.refeicao.preco_estimado,35);
    assert.equal(JSON.parse(await snapshot(paid)).planos[0].resumo.custo_estimado_total,35);
    assert.equal(await query(`select count(*) from itens_pedido where id_pedido=${result.pedido.id_pedido};`),"1");
});
test("PostgreSQL: falha de produto na conversao desfaz a reserva e vinculos", async () => {
    const ctx=await fixture(); const plan=await mutate(ctx,"GERAR",1,0,null,ctx.generated);
    await query(`update produtos set disponivel=false where id_produto=${ctx.product};`); const original=await snapshot(ctx);
    await assert.rejects(query(conversion(ctx,plan.refeicoes[0].id_refeicao_planejada,1,1,true)),/produto/i);
    assert.equal(await snapshot(ctx),original);
});
