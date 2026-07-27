alter table public.pagamentos
  drop constraint if exists pagamentos_tipo_fluxo_pagamento_check;

alter table public.pagamentos
  add constraint pagamentos_tipo_fluxo_pagamento_check
  check (tipo_fluxo_pagamento in (
    'DIRETO_APPONO',
    'MARKETPLACE_RESTAURANTE',
    'SIMULADO_APPONO'
  ));

update public.pagamentos
set status_repasse = 'AGUARDANDO_PAGAMENTO'
where tipo_fluxo_pagamento = 'SIMULADO_APPONO'
  and status_repasse = 'NAO_APLICAVEL';
