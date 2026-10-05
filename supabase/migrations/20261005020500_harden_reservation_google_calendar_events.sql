begin;

create index if not exists eventos_reserva_agenda_conexao_status_idx
  on public.eventos_reserva_agenda(id_conexao_agenda, status, atualizado_em desc);

drop trigger if exists set_updated_at_eventos_reserva_agenda on public.eventos_reserva_agenda;
create trigger set_updated_at_eventos_reserva_agenda
before update on public.eventos_reserva_agenda
for each row execute function public.set_atualizado_em();

notify pgrst, 'reload schema';
commit;
