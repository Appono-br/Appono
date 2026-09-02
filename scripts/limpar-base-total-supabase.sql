-- Use apenas em ambiente de teste/desenvolvimento.
-- Reset total dos dados da Appono para teste ponta a ponta.
--
-- Este script preserva apenas a estrutura do banco, migrations, policies,
-- funções, triggers, buckets e configurações do Supabase.
-- Ele apaga dados de clientes, restaurantes e relações operacionais.
--
-- Observação importante:
-- Os usuários do Supabase Auth ficam em auth.users e devem ser removidos
-- pelo painel Authentication > Users ou por script admin separado.

begin;

do $$
begin
  if exists (
    select 1
    from pg_trigger trigger
    join pg_class tabela on tabela.oid = trigger.tgrelid
    join pg_namespace schema on schema.oid = tabela.relnamespace
    where schema.nspname = 'public'
      and tabela.relname = 'eventos_financeiros'
      and trigger.tgname = 'eventos_financeiros_append_only'
  ) then
    alter table public.eventos_financeiros
      disable trigger eventos_financeiros_append_only;
  end if;
end $$;

do $$
declare
  tabelas text[] := array[
    'notificacoes',
    'solicitacoes_reembolso',
    'eventos_financeiros',
    'webhooks_mercado_pago',
    'avaliacoes_restaurante',
    'restaurantes_favoritos',
    'item_adicional',
    'itens_pedido',
    'pagamentos',
    'pedidos',
    'reservas',
    'mercado_pago_conexoes_restaurante',
    'dados_bancarios_restaurante',
    'adicionais',
    'produtos',
    'categorias',
    'cardapios',
    'mesas',
    'clientes',
    'restaurantes'
  ];
  existentes text;
begin
  select string_agg(format('public.%I', table_name), ', ')
  into existentes
  from information_schema.tables
  where table_schema = 'public'
    and table_name = any(tabelas);

  if existentes is not null then
    execute 'truncate table ' || existentes || ' restart identity cascade';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_trigger trigger
    join pg_class tabela on tabela.oid = trigger.tgrelid
    join pg_namespace schema on schema.oid = tabela.relnamespace
    where schema.nspname = 'public'
      and tabela.relname = 'eventos_financeiros'
      and trigger.tgname = 'eventos_financeiros_append_only'
  ) then
    alter table public.eventos_financeiros
      enable trigger eventos_financeiros_append_only;
  end if;
end $$;

commit;
