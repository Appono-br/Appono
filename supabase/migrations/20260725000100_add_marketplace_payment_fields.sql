alter table public.pagamentos
  add column if not exists tipo_fluxo_pagamento text not null default 'DIRETO_APPONO',
  add column if not exists percentual_comissao_app numeric(5, 2),
  add column if not exists valor_comissao_app numeric(10, 2),
  add column if not exists valor_restaurante numeric(10, 2),
  add column if not exists mercado_pago_restaurante_user_id text,
  add column if not exists status_repasse text not null default 'NAO_APLICAVEL';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_tipo_fluxo_pagamento_check'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_tipo_fluxo_pagamento_check
      check (tipo_fluxo_pagamento in ('DIRETO_APPONO', 'MARKETPLACE_RESTAURANTE', 'SIMULADO_APPONO'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_status_repasse_check'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_status_repasse_check
      check (status_repasse in (
        'NAO_APLICAVEL',
        'AGUARDANDO_PAGAMENTO',
        'AGUARDANDO_ENTREGA',
        'LIBERADO_PARA_REPASSE',
        'REPASSADO',
        'ESTORNADO'
      ));
  end if;
end;
$$;

update public.pagamentos
set
  tipo_fluxo_pagamento = coalesce(tipo_fluxo_pagamento, 'DIRETO_APPONO'),
  status_repasse = case
    when tipo_fluxo_pagamento = 'MARKETPLACE_RESTAURANTE'
      then coalesce(status_repasse, 'AGUARDANDO_PAGAMENTO')
    when tipo_fluxo_pagamento = 'SIMULADO_APPONO'
      then coalesce(status_repasse, 'AGUARDANDO_PAGAMENTO')
    else coalesce(status_repasse, 'NAO_APLICAVEL')
  end;
