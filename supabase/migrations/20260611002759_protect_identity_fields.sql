-- Identity documents and birth date are registration facts and cannot be
-- changed through the application, even if a client bypasses the frontend.

create or replace function app_private.protect_immutable_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'clientes' then
    if new.cpf is distinct from old.cpf or new.dt_nasc is distinct from old.dt_nasc then
      raise exception 'CPF e data de nascimento nao podem ser alterados';
    end if;
  elsif tg_table_name = 'restaurantes' then
    if new.cnpj is distinct from old.cnpj then
      raise exception 'CNPJ nao pode ser alterado';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.protect_immutable_profile_fields() from public;

drop trigger if exists protect_immutable_profile_fields on public.clientes;
create trigger protect_immutable_profile_fields
before update on public.clientes
for each row execute function app_private.protect_immutable_profile_fields();

drop trigger if exists protect_immutable_profile_fields on public.restaurantes;
create trigger protect_immutable_profile_fields
before update on public.restaurantes
for each row execute function app_private.protect_immutable_profile_fields();
