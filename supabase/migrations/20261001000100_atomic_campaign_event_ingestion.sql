begin;

create or replace function public.registrar_evento_campanha_atomico(
  p_actor uuid,
  p_id_cliente bigint,
  p_id_campanha bigint,
  p_tipo text,
  p_chave_deduplicacao text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  quantidade integer;
begin
  if p_tipo not in ('IMPRESSION', 'CLICK', 'RESERVA_INICIADA') then
    raise exception 'Evento inválido';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id_cliente = p_id_cliente and c.id_auth = p_actor
  ) then
    raise exception 'Cliente inválido';
  end if;
  if not exists (
    select 1 from public.campanhas_inteligentes_restaurante c
    where c.id_campanha = p_id_campanha
      and c.status in ('ATIVA', 'AGENDADA')
      and not c.precisa_configuracao
      and c.inicio_em <= now() and c.fim_em > now()
      and c.usos_confirmados < c.limite_usos
      and appono_private.campanha_profissional(c.id_restaurante)
  ) then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('campanha-evento:' || p_id_cliente::text, 0));
  select count(*) into quantidade
  from public.eventos_campanha_inteligente e
  where e.id_cliente = p_id_cliente and e.criado_em >= now() - interval '1 hour';
  if quantidade >= 200 then
    raise sqlstate 'PT429' using message = 'Limite de eventos atingido.';
  end if;

  insert into public.eventos_campanha_inteligente(id_campanha, tipo, id_cliente, chave_deduplicacao)
  values (p_id_campanha, p_tipo, p_id_cliente, p_chave_deduplicacao)
  on conflict (id_campanha, tipo, chave_deduplicacao) where chave_deduplicacao is not null do nothing;
  return true;
end;
$$;

revoke all on function public.registrar_evento_campanha_atomico(uuid, bigint, bigint, text, text) from public, anon, authenticated;
grant execute on function public.registrar_evento_campanha_atomico(uuid, bigint, bigint, text, text) to service_role;

notify pgrst, 'reload schema';
commit;
