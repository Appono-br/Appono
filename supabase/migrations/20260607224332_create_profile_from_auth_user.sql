-- Create Appono profile rows when a user is created in Supabase Auth.
-- This keeps registration working even when e-mail confirmation is enabled.

create schema if not exists app_private;

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

revoke all on function app_private.handle_new_auth_user() from public;
grant usage on schema app_private to supabase_auth_admin;
grant execute on function app_private.handle_new_auth_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created_create_appono_profile on auth.users;

create trigger on_auth_user_created_create_appono_profile
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();
