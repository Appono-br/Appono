begin;

create table public.eventos_planejamento_agenda (
  id_evento_planejamento_agenda bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_conexao_agenda bigint not null,
  id_planejamento_rotina bigint not null references public.planejamentos_rotina(id_planejamento_rotina) on delete cascade,
  -- Mantém o vínculo externo após uma regeneração apagar a sugestão local,
  -- permitindo remover o evento antigo do Google na sincronização seguinte.
  id_refeicao_planejada bigint references public.refeicoes_planejadas(id_refeicao_planejada) on delete set null,
  provedor text not null,
  calendario_externo_id text not null default 'primary',
  evento_externo_id text not null,
  hash_conteudo text not null,
  status text not null default 'PENDENTE',
  erro_codigo text,
  sincronizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint eventos_planejamento_agenda_provedor_check check (provedor = 'GOOGLE'),
  constraint eventos_planejamento_agenda_evento_check check (char_length(evento_externo_id) between 5 and 1024),
  constraint eventos_planejamento_agenda_hash_check check (char_length(hash_conteudo) = 64),
  constraint eventos_planejamento_agenda_status_check check (status in ('PENDENTE','SINCRONIZADO','FALHOU','REMOVIDO')),
  constraint eventos_planejamento_agenda_erro_check check (erro_codigo is null or char_length(erro_codigo) between 2 and 80),
  unique (id_conexao_agenda, id_refeicao_planejada),
  unique (id_conexao_agenda, evento_externo_id),
  foreign key (id_conexao_agenda, id_cliente)
    references public.conexoes_agenda_cliente(id_conexao_agenda, id_cliente) on delete cascade
);

create index eventos_planejamento_agenda_plano_idx
  on public.eventos_planejamento_agenda (id_cliente, id_planejamento_rotina, status);

create trigger set_updated_at_eventos_planejamento_agenda
before update on public.eventos_planejamento_agenda
for each row execute function public.set_atualizado_em();

alter table public.eventos_planejamento_agenda enable row level security;
revoke all on table public.eventos_planejamento_agenda from public, anon, authenticated;
grant all on table public.eventos_planejamento_agenda to service_role;
grant usage, select on sequence public.eventos_planejamento_agenda_id_evento_planejamento_agenda_seq to service_role;

commit;
