begin;

alter table public.assinaturas_restaurante
  add column if not exists mercadopago_preapproval_plan_id text;

create unique index if not exists assinaturas_restaurante_mp_plan_uidx
  on public.assinaturas_restaurante (mercadopago_preapproval_plan_id)
  where mercadopago_preapproval_plan_id is not null;

commit;
