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
    if new.cnpj is distinct from old.cnpj or new.razao_social is distinct from old.razao_social then
      raise exception 'CNPJ e razao social nao podem ser alterados';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.protect_immutable_profile_fields() from public;
