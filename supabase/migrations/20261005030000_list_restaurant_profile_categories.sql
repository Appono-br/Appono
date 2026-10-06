begin;

-- Agrupa somente categorias escolhidas no perfil de restaurantes ativos.
-- public.categorias contém seções do cardápio e não participa desta consulta.
create or replace function public.listar_categorias_restaurantes()
returns table (categoria text, total_restaurantes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select escolhida.categoria, count(distinct restaurante.id_restaurante)
  from public.restaurantes restaurante
  cross join lateral unnest(restaurante.categorias_culinarias) escolhida(categoria)
  where restaurante.ativo = true
    and nullif(btrim(escolhida.categoria), '') is not null
  group by escolhida.categoria
  order by escolhida.categoria;
$$;

revoke all on function public.listar_categorias_restaurantes() from public;
grant execute on function public.listar_categorias_restaurantes() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
