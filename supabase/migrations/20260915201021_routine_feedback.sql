begin;

create table public.feedback_rotina_cliente (
  id_feedback_rotina bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_refeicao_planejada bigint not null references public.refeicoes_planejadas(id_refeicao_planejada) on delete cascade,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  gostou boolean not null,
  repetiria boolean,
  motivo text,
  tags text[] not null default '{}'::text[],
  consentiu_personalizacao boolean not null default false,
  versao_modelo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  excluido_em timestamptz,
  constraint feedback_rotina_motivo_check check (motivo is null or char_length(trim(motivo)) between 2 and 500),
  constraint feedback_rotina_tags_check check (cardinality(tags) <= 8),
  constraint feedback_rotina_modelo_check check (versao_modelo is null or char_length(trim(versao_modelo)) between 2 and 80),
  unique (id_cliente, id_refeicao_planejada)
);
create index feedback_rotina_cliente_idx on public.feedback_rotina_cliente (id_cliente, criado_em desc) where excluido_em is null;
create index feedback_rotina_refeicao_idx on public.feedback_rotina_cliente (id_refeicao_planejada) where excluido_em is null;

create trigger set_updated_at_feedback_rotina_cliente
before update on public.feedback_rotina_cliente
for each row execute function public.set_atualizado_em();

alter table public.feedback_rotina_cliente enable row level security;
revoke all on public.feedback_rotina_cliente from public, anon, authenticated;
grant select on public.feedback_rotina_cliente to authenticated;

create policy "Cliente le seu feedback de rotina"
on public.feedback_rotina_cliente for select to authenticated
using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

create or replace function appono_private.registrar_feedback_rotina(
  p_id_refeicao bigint,
  p_gostou boolean,
  p_repetiria boolean,
  p_motivo text,
  p_tags text[],
  p_consentiu boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  refeicao public.refeicoes_planejadas;
  reserva public.reservas;
  pedido public.pedidos;
  feedback public.feedback_rotina_cliente;
  modelo text;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  if cliente_id is null then raise sqlstate 'PT401' using message = 'Cliente nao autenticado'; end if;
  select * into refeicao from public.refeicoes_planejadas
    where id_refeicao_planejada = p_id_refeicao and id_cliente = cliente_id for update;
  if refeicao.id_refeicao_planejada is null then raise sqlstate 'PT404' using message = 'Refeicao nao encontrada'; end if;
  select * into reserva from public.reservas where id_reserva = refeicao.id_reserva;
  select * into pedido from public.pedidos where id_pedido = refeicao.id_pedido;
  if not ((reserva.id_reserva is not null and reserva.status_reserva = 'CONCLUIDA')
    or (pedido.id_pedido is not null and pedido.status_pedido = 'ENTREGUE')) then
    raise sqlstate 'PT409' using message = 'Feedback disponivel somente apos a experiencia concluida';
  end if;
  if p_motivo is not null and char_length(trim(p_motivo)) not between 2 and 500 then raise sqlstate '22023' using message = 'Motivo invalido'; end if;
  if cardinality(coalesce(p_tags, '{}'::text[])) > 8 then raise sqlstate '22023' using message = 'Muitas tags'; end if;
  modelo := refeicao.metadados->>'modelo_recomendacao';
  insert into public.feedback_rotina_cliente(id_cliente,id_refeicao_planejada,id_reserva,id_pedido,gostou,repetiria,motivo,tags,consentiu_personalizacao,versao_modelo)
    values(cliente_id,p_id_refeicao,refeicao.id_reserva,refeicao.id_pedido,p_gostou,p_repetiria,nullif(trim(p_motivo),''),coalesce(p_tags,'{}'::text[]),p_consentiu,modelo)
  on conflict(id_cliente,id_refeicao_planejada) do update set gostou=excluded.gostou,repetiria=excluded.repetiria,
    motivo=excluded.motivo,tags=excluded.tags,consentiu_personalizacao=excluded.consentiu_personalizacao,
    versao_modelo=excluded.versao_modelo,excluido_em=null
  returning * into feedback;
  return to_jsonb(feedback);
end;
$$;
revoke all on function appono_private.registrar_feedback_rotina(bigint,boolean,boolean,text,text[],boolean) from public, anon;
grant execute on function appono_private.registrar_feedback_rotina(bigint,boolean,boolean,text,text[],boolean) to authenticated;

create or replace function public.registrar_feedback_rotina(
  p_id_refeicao bigint,p_gostou boolean,p_repetiria boolean,p_motivo text default null,p_tags text[] default '{}',p_consentiu boolean default false
)
returns jsonb language sql security invoker set search_path = '' as $$
  select appono_private.registrar_feedback_rotina(p_id_refeicao,p_gostou,p_repetiria,p_motivo,p_tags,p_consentiu);
$$;
revoke all on function public.registrar_feedback_rotina(bigint,boolean,boolean,text,text[],boolean) from public, anon;
grant execute on function public.registrar_feedback_rotina(bigint,boolean,boolean,text,text[],boolean) to authenticated;

create or replace function appono_private.excluir_feedback_rotina(p_id_refeicao bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cliente_id bigint;
  feedback public.feedback_rotina_cliente;
begin
  select id_cliente into cliente_id from public.clientes where id_auth = (select auth.uid());
  if cliente_id is null then raise sqlstate 'PT401' using message = 'Cliente nao autenticado'; end if;
  update public.feedback_rotina_cliente
    set excluido_em = now(), consentiu_personalizacao = false
    where id_cliente = cliente_id
      and id_refeicao_planejada = p_id_refeicao
      and excluido_em is null
    returning * into feedback;
  if feedback.id_feedback_rotina is null then raise sqlstate 'PT404' using message = 'Feedback nao encontrado'; end if;
  return to_jsonb(feedback);
end;
$$;
revoke all on function appono_private.excluir_feedback_rotina(bigint) from public, anon;
grant execute on function appono_private.excluir_feedback_rotina(bigint) to authenticated;

create or replace function public.excluir_feedback_rotina(p_id_refeicao bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select appono_private.excluir_feedback_rotina(p_id_refeicao);
$$;
revoke all on function public.excluir_feedback_rotina(bigint) from public, anon;
grant execute on function public.excluir_feedback_rotina(bigint) to authenticated;

commit;
