alter table public.restaurantes
  add column if not exists razao_social text;

update public.restaurantes
set razao_social = nome
where razao_social is null;

alter table public.restaurantes
  alter column razao_social set not null;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'imagens-restaurantes',
  'imagens-restaurantes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Restaurante envia a propria imagem" on storage.objects;
create policy "Restaurante envia a propria imagem"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'imagens-restaurantes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Restaurante consulta a propria imagem" on storage.objects;
create policy "Restaurante consulta a propria imagem"
on storage.objects for select to authenticated
using (
  bucket_id = 'imagens-restaurantes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Restaurante atualiza a propria imagem" on storage.objects;
create policy "Restaurante atualiza a propria imagem"
on storage.objects for update to authenticated
using (
  bucket_id = 'imagens-restaurantes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'imagens-restaurantes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Restaurante exclui a propria imagem" on storage.objects;
create policy "Restaurante exclui a propria imagem"
on storage.objects for delete to authenticated
using (
  bucket_id = 'imagens-restaurantes'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile jsonb;
  kind text;
  restaurant_id bigint;
  table_count integer;
begin
  profile := new.raw_user_meta_data -> 'appono_profile';
  kind := profile ->> 'tipo';

  if profile is null or kind is null then
    return new;
  end if;

  if kind = 'cliente' then
    insert into public.clientes (
      id_auth,
      nome,
      cpf,
      telefone,
      email,
      dt_nasc
    )
    values (
      new.id,
      profile ->> 'nome',
      profile ->> 'cpf',
      profile ->> 'telefone',
      coalesce(profile ->> 'email', new.email),
      nullif(profile ->> 'dt_nasc', '')::date
    )
    on conflict (id_auth) do nothing;

    return new;
  end if;

  if kind = 'restaurante' then
    insert into public.restaurantes (
      id_auth,
      nome,
      razao_social,
      cnpj,
      telefone,
      email,
      cep,
      endereco,
      horario_funcionamento
    )
    values (
      new.id,
      profile ->> 'nome',
      profile ->> 'razao_social',
      profile ->> 'cnpj',
      profile ->> 'telefone',
      coalesce(profile ->> 'email', new.email),
      profile ->> 'cep',
      profile ->> 'endereco',
      coalesce(nullif(profile ->> 'horario_funcionamento', ''), 'A definir')
    )
    on conflict (id_auth) do update
      set updated_at = public.restaurantes.updated_at
    returning id_restaurante into restaurant_id;

    if restaurant_id is null then
      select id_restaurante into restaurant_id
      from public.restaurantes
      where id_auth = new.id;
    end if;

    if restaurant_id is not null then
      if profile ? 'dados_bancarios' then
        insert into public.dados_bancarios_restaurante (
          id_restaurante,
          cod_banco,
          agencia,
          conta_corrente,
          chave_pix
        )
        values (
          restaurant_id,
          nullif(profile #>> '{dados_bancarios,cod_banco}', ''),
          nullif(profile #>> '{dados_bancarios,agencia}', ''),
          nullif(profile #>> '{dados_bancarios,conta_corrente}', ''),
          nullif(profile #>> '{dados_bancarios,chave_pix}', '')
        );
      end if;

      table_count := greatest(coalesce(nullif(profile ->> 'quantidade_mesas', '')::integer, 0), 0);

      if table_count > 0 then
        insert into public.mesas (id_restaurante, numero_mesa, capacidade)
        select restaurant_id, series.numero, 4
        from generate_series(1, table_count) as series(numero)
        on conflict (id_restaurante, numero_mesa) do nothing;
      end if;
    end if;
  end if;

  return new;
end;
$$;
