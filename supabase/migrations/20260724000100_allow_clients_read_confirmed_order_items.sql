do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'itens_pedido'
      and policyname = 'Cliente visualiza itens dos proprios pedidos'
  ) then
    create policy "Cliente visualiza itens dos proprios pedidos"
    on public.itens_pedido
    for select
    to authenticated
    using (
      id_pedido in (
        select pedido.id_pedido
        from public.pedidos pedido
        join public.clientes cliente using (id_cliente)
        where cliente.id_auth = (select auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'item_adicional'
      and policyname = 'Cliente visualiza adicionais dos proprios pedidos'
  ) then
    create policy "Cliente visualiza adicionais dos proprios pedidos"
    on public.item_adicional
    for select
    to authenticated
    using (
      id_item in (
        select item.id_item
        from public.itens_pedido item
        join public.pedidos pedido using (id_pedido)
        join public.clientes cliente using (id_cliente)
        where cliente.id_auth = (select auth.uid())
      )
    );
  end if;
end
$$;
