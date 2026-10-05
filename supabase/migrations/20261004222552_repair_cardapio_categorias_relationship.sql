begin;

do $$
begin
  if to_regclass('public.cardapios') is null or to_regclass('public.categorias') is null then
    raise exception 'As tabelas public.cardapios e public.categorias precisam existir antes desta migration.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'categorias'
      and column_name = 'id_cardapio'
  ) then
    raise exception 'A coluna public.categorias.id_cardapio não existe.';
  end if;

  if exists (
    select 1
    from public.categorias categoria
    left join public.cardapios cardapio on cardapio.id_cardapio = categoria.id_cardapio
    where categoria.id_cardapio is not null
      and cardapio.id_cardapio is null
  ) then
    raise exception 'Existem categorias sem cardápio correspondente; corrija esses registros antes de criar a chave estrangeira.';
  end if;

  if not exists (
    select 1
    from pg_constraint constraint_row
    join pg_class table_row on table_row.oid = constraint_row.conrelid
    join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
    join pg_class referenced_table_row on referenced_table_row.oid = constraint_row.confrelid
    where constraint_row.contype = 'f'
      and namespace_row.nspname = 'public'
      and table_row.relname = 'categorias'
      and referenced_table_row.relname = 'cardapios'
  ) then
    alter table public.categorias
      add constraint categorias_id_cardapio_fkey
      foreign key (id_cardapio)
      references public.cardapios (id_cardapio)
      on delete cascade;
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
