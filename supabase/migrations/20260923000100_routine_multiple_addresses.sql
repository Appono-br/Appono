begin;

alter table public.perfis_rotina_cliente
  add column if not exists enderecos_rotina jsonb not null default '[]'::jsonb,
  add column if not exists endereco_ativo_id text;

alter table public.perfis_rotina_cliente
  drop constraint if exists perfis_rotina_cliente_enderecos_check;

alter table public.perfis_rotina_cliente
  add constraint perfis_rotina_cliente_enderecos_check
  check (jsonb_typeof(enderecos_rotina) = 'array' and jsonb_array_length(enderecos_rotina) <= 10);

comment on column public.perfis_rotina_cliente.enderecos_rotina is
  'Enderecos nomeados da rotina. O item ativo espelha endereco_base/latitude/longitude para manter compatibilidade.';

commit;
