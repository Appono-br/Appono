create table if not exists public.solicitacoes_reembolso (
  id_reembolso bigserial primary key,
  id_pagamento bigint not null references public.pagamentos(id_pagamento) on delete restrict,
  id_pedido bigint not null references public.pedidos(id_pedido) on delete restrict,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_cliente bigint not null references public.clientes(id_cliente) on delete restrict,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete restrict,
  valor_solicitado numeric(10, 2) not null check (valor_solicitado > 0),
  motivo text not null check (char_length(motivo) between 10 and 500),
  resposta text check (resposta is null or char_length(resposta) <= 500),
  status_reembolso text not null default 'SOLICITADO' check (status_reembolso in (
    'SOLICITADO', 'EM_ANALISE', 'APROVADO', 'RECUSADO', 'CONCLUIDO', 'CANCELADO'
  )),
  modo_execucao text not null default 'MERCADO_PAGO_TESTE' check (modo_execucao in ('MERCADO_PAGO_TESTE', 'MERCADO_PAGO_PRODUCAO')),
  solicitado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  analisado_em timestamptz,
  concluido_em timestamptz,
  id_auth_analista uuid
);

create unique index if not exists solicitacoes_reembolso_pagamento_ativo_uidx
  on public.solicitacoes_reembolso (id_pagamento)
  where status_reembolso in ('SOLICITADO', 'EM_ANALISE', 'APROVADO', 'CONCLUIDO');

create index if not exists solicitacoes_reembolso_cliente_idx on public.solicitacoes_reembolso (id_cliente, solicitado_em desc);
create index if not exists solicitacoes_reembolso_restaurante_idx on public.solicitacoes_reembolso (id_restaurante, solicitado_em desc);

alter table public.solicitacoes_reembolso enable row level security;
revoke all on table public.solicitacoes_reembolso from anon, authenticated;
grant select on table public.solicitacoes_reembolso to authenticated;

drop policy if exists "Cliente consulta reembolsos proprios" on public.solicitacoes_reembolso;
create policy "Cliente consulta reembolsos proprios" on public.solicitacoes_reembolso
  for select to authenticated using (
    exists (select 1 from public.clientes where clientes.id_cliente = solicitacoes_reembolso.id_cliente and clientes.id_auth = auth.uid())
  );

drop policy if exists "Restaurante consulta reembolsos proprios" on public.solicitacoes_reembolso;
create policy "Restaurante consulta reembolsos proprios" on public.solicitacoes_reembolso
  for select to authenticated using (
    exists (select 1 from public.restaurantes where restaurantes.id_restaurante = solicitacoes_reembolso.id_restaurante and restaurantes.id_auth = auth.uid())
  );

alter table public.pagamentos drop constraint if exists pagamentos_status_repasse_check;
alter table public.pagamentos add constraint pagamentos_status_repasse_check check (status_repasse in (
  'NAO_APLICAVEL', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_ENTREGA',
  'LIBERADO_PARA_REPASSE', 'REPASSADO', 'ESTORNADO'
));

create or replace function public.concluir_reembolso_simulado(
  reembolso_id bigint,
  analista_id uuid,
  resposta_analise text default null
) returns public.solicitacoes_reembolso
language plpgsql
security definer
set search_path = public
as $$
declare
  solicitacao public.solicitacoes_reembolso;
begin
  select * into solicitacao from public.solicitacoes_reembolso
  where id_reembolso = reembolso_id for update;

  if solicitacao.id_reembolso is null then raise exception 'Reembolso nao encontrado'; end if;
  if solicitacao.status_reembolso <> 'SOLICITADO' then raise exception 'Reembolso ja analisado'; end if;
  if not exists (
    select 1 from public.pagamentos
    where id_pagamento = solicitacao.id_pagamento
      and status_pagamento in ('APROVADO', 'ESTORNADO')
      and tipo_fluxo_pagamento = 'SIMULADO_APPONO'
      and status_repasse <> 'ESTORNADO'
  ) then raise exception 'Pagamento nao elegivel para reembolso simulado'; end if;

  update public.pagamentos set
    status_pagamento = 'ESTORNADO',
    status_repasse = 'ESTORNADO',
    atualizado_em = now(),
    updated_at = now()
  where id_pagamento = solicitacao.id_pagamento;

  update public.solicitacoes_reembolso set
    status_reembolso = 'CONCLUIDO',
    resposta = nullif(trim(resposta_analise), ''),
    id_auth_analista = analista_id,
    analisado_em = now(),
    concluido_em = now(),
    atualizado_em = now()
  where id_reembolso = reembolso_id
  returning * into solicitacao;

  insert into public.eventos_financeiros (id_pagamento, id_pedido, id_reserva, tipo_evento, descricao, valor)
  values (solicitacao.id_pagamento, solicitacao.id_pedido, solicitacao.id_reserva,
    'REEMBOLSO_TESTE_CONCLUIDO', 'Reembolso confirmado no ambiente de testes do Mercado Pago; o repasse do marketplace permanece simulado.', solicitacao.valor_solicitado);

  return solicitacao;
end;
$$;

revoke all on function public.concluir_reembolso_simulado(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.concluir_reembolso_simulado(bigint, uuid, text) to service_role;
