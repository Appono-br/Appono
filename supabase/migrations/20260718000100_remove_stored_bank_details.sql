begin;

-- Remove dados bancarios sensiveis que ja tenham sido persistidos no MVP.
delete from public.dados_bancarios_restaurante;

alter table public.dados_bancarios_restaurante
  add column if not exists status_cadastro text not null default 'nao_configurado',
  add column if not exists provedor_pagamento text,
  add column if not exists referencia_externa text,
  add column if not exists updated_at timestamptz not null default now(),
  drop column if exists cod_banco,
  drop column if exists agencia,
  drop column if exists conta_corrente,
  drop column if exists chave_pix;

alter table public.dados_bancarios_restaurante
  drop constraint if exists dados_bancarios_restaurante_status_cadastro_check;

alter table public.dados_bancarios_restaurante
  add constraint dados_bancarios_restaurante_status_cadastro_check
  check (status_cadastro in ('nao_configurado', 'pendente_validacao', 'validado', 'reprovado'));

alter table public.dados_bancarios_restaurante
  drop constraint if exists dados_bancarios_restaurante_id_restaurante_key;

alter table public.dados_bancarios_restaurante
  add constraint dados_bancarios_restaurante_id_restaurante_key unique (id_restaurante);

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

commit;
