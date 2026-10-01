begin;

create table if not exists public.planos_restaurante (
  id_plano smallserial primary key,
  codigo text not null unique,
  nome text not null,
  mensalidade numeric(10,2) not null default 0,
  percentual_comissao numeric(5,2) not null,
  campanhas_inteligentes boolean not null default false,
  destaque_profissional boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint planos_restaurante_codigo_check check (codigo in ('INICIAL','PROFISSIONAL')),
  constraint planos_restaurante_valores_check check (mensalidade >= 0 and percentual_comissao between 0 and 100)
);

insert into public.planos_restaurante (codigo,nome,mensalidade,percentual_comissao,campanhas_inteligentes,destaque_profissional)
values
  ('INICIAL','Plano Inicial',0,8,false,false),
  ('PROFISSIONAL','Plano Profissional',200,3,true,true)
on conflict (codigo) do update set
  nome = excluded.nome,
  mensalidade = excluded.mensalidade,
  percentual_comissao = excluded.percentual_comissao,
  campanhas_inteligentes = excluded.campanhas_inteligentes,
  destaque_profissional = excluded.destaque_profissional;

create table if not exists public.assinaturas_restaurante (
  id_assinatura bigserial primary key,
  id_restaurante bigint not null unique references public.restaurantes(id_restaurante) on delete cascade,
  codigo_plano text not null references public.planos_restaurante(codigo),
  status text not null default 'ATIVA',
  mensalidade numeric(10,2) not null,
  percentual_comissao numeric(5,2) not null,
  periodo_inicio_em timestamptz,
  periodo_fim_em timestamptz,
  cancelar_no_fim_do_periodo boolean not null default false,
  mercadopago_preapproval_id text unique,
  checkout_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint assinaturas_restaurante_status_check check (status in ('PENDENTE_PAGAMENTO','ATIVA','INADIMPLENTE','CANCELADA')),
  constraint assinaturas_restaurante_valores_check check (mensalidade >= 0 and percentual_comissao between 0 and 100)
);

insert into public.assinaturas_restaurante (id_restaurante,codigo_plano,status,mensalidade,percentual_comissao)
select r.id_restaurante,'INICIAL','ATIVA',0,8 from public.restaurantes r
on conflict (id_restaurante) do nothing;

create table if not exists public.historico_assinaturas_restaurante (
  id_historico bigserial primary key,
  id_assinatura bigint not null references public.assinaturas_restaurante(id_assinatura) on delete cascade,
  codigo_plano_anterior text references public.planos_restaurante(codigo),
  codigo_plano_novo text not null references public.planos_restaurante(codigo),
  status_anterior text,
  status_novo text not null,
  motivo text not null,
  criado_em timestamptz not null default now(),
  constraint historico_assinatura_motivo_check check (char_length(trim(motivo)) between 3 and 160)
);

create table if not exists public.cobrancas_assinatura_restaurante (
  id_cobranca bigserial primary key,
  id_assinatura bigint not null references public.assinaturas_restaurante(id_assinatura) on delete cascade,
  referencia_externa text not null unique,
  mercadopago_payment_id text unique,
  valor numeric(10,2) not null,
  status text not null default 'PENDENTE',
  vencimento_em timestamptz,
  pago_em timestamptz,
  dados_provedor jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cobrancas_assinatura_status_check check (status in ('PENDENTE','APROVADA','RECUSADA','ESTORNADA')),
  constraint cobrancas_assinatura_valor_check check (valor > 0),
  constraint cobrancas_assinatura_dados_check check (jsonb_typeof(dados_provedor) = 'object')
);

alter table public.pedidos
  add column if not exists codigo_plano_comissao text,
  add column if not exists percentual_comissao_app numeric(5,2),
  add column if not exists valor_comissao_app numeric(10,2);

alter table public.pagamentos
  add column if not exists codigo_plano_comissao text;

alter table public.eventos_financeiros
  add column if not exists codigo_plano_comissao text,
  add column if not exists percentual_comissao_app numeric(5,2),
  add column if not exists valor_comissao_app numeric(10,2);

create table if not exists public.campanhas_inteligentes_restaurante (
  id_campanha bigserial primary key,
  id_restaurante bigint not null references public.restaurantes(id_restaurante) on delete cascade,
  titulo text not null,
  descricao text,
  imagem_url text,
  tipo_beneficio text not null,
  valor_beneficio numeric(10,2),
  regras text,
  inicio_em timestamptz not null,
  fim_em timestamptz not null,
  limite_usos integer not null,
  usos_confirmados integer not null default 0,
  minimo_pessoas integer,
  minimo_itens integer,
  status text not null default 'RASCUNHO',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint campanhas_tipo_beneficio_check check (tipo_beneficio in ('DESCONTO_PERCENTUAL','DESCONTO_FIXO','ITEM_CORTESIA','BEBIDA','ENTRADA','SOBREMESA','COMBO')),
  constraint campanhas_status_check check (status in ('RASCUNHO','AGENDADA','ATIVA','PAUSADA','ENCERRADA','ESGOTADA','EXPIRADA')),
  constraint campanhas_janela_check check (fim_em > inicio_em),
  constraint campanhas_limites_check check (limite_usos between 1 and 100000 and usos_confirmados between 0 and limite_usos),
  constraint campanhas_beneficio_check check ((tipo_beneficio in ('DESCONTO_PERCENTUAL','DESCONTO_FIXO') and valor_beneficio is not null and valor_beneficio > 0) or (tipo_beneficio not in ('DESCONTO_PERCENTUAL','DESCONTO_FIXO'))),
  constraint campanhas_minimos_check check ((minimo_pessoas is null or minimo_pessoas between 1 and 30) and (minimo_itens is null or minimo_itens between 1 and 100))
);

create table if not exists public.campanhas_inteligentes_produtos (
  id_campanha bigint not null references public.campanhas_inteligentes_restaurante(id_campanha) on delete cascade,
  id_produto bigint not null references public.produtos(id_produto) on delete restrict,
  primary key (id_campanha,id_produto)
);

create table if not exists public.resgates_campanha_inteligente (
  id_resgate bigserial primary key,
  id_campanha bigint not null references public.campanhas_inteligentes_restaurante(id_campanha) on delete restrict,
  id_reserva bigint unique references public.reservas(id_reserva) on delete set null,
  id_pedido bigint unique references public.pedidos(id_pedido) on delete set null,
  valor_beneficio numeric(10,2) not null default 0,
  status text not null default 'RESERVADO',
  criado_em timestamptz not null default now(),
  constraint resgates_campanha_status_check check (status in ('RESERVADO','APLICADO','CANCELADO')),
  constraint resgates_campanha_origem_check check (id_reserva is not null or id_pedido is not null)
);

create table if not exists public.eventos_campanha_inteligente (
  id_evento bigserial primary key,
  id_campanha bigint not null references public.campanhas_inteligentes_restaurante(id_campanha) on delete cascade,
  tipo text not null,
  id_cliente bigint references public.clientes(id_cliente) on delete set null,
  id_reserva bigint references public.reservas(id_reserva) on delete set null,
  id_pedido bigint references public.pedidos(id_pedido) on delete set null,
  criado_em timestamptz not null default now(),
  constraint eventos_campanha_tipo_check check (tipo in ('IMPRESSION','CLICK','RESERVA_INICIADA','RESGATE','PEDIDO_PAGO'))
);

create table if not exists public.consentimentos_ofertas_cliente (
  id_cliente bigint primary key references public.clientes(id_cliente) on delete cascade,
  habilitado boolean not null default false,
  concedido_em timestamptz,
  revogado_em timestamptz,
  atualizado_em timestamptz not null default now()
);

create index if not exists assinaturas_restaurante_status_idx on public.assinaturas_restaurante(codigo_plano,status);
create index if not exists cobrancas_assinatura_idx on public.cobrancas_assinatura_restaurante(id_assinatura,criado_em desc);
create index if not exists campanhas_restaurante_status_idx on public.campanhas_inteligentes_restaurante(id_restaurante,status,inicio_em,fim_em);
create index if not exists campanhas_publicas_idx on public.campanhas_inteligentes_restaurante(status,inicio_em,fim_em) where status in ('AGENDADA','ATIVA');
create index if not exists eventos_campanha_idx on public.eventos_campanha_inteligente(id_campanha,tipo,criado_em desc);

create or replace function public.atualizar_timestamp_planos_restaurante() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.atualizado_em = now(); return new; end; $$;
drop trigger if exists atualizar_assinatura_restaurante on public.assinaturas_restaurante;
create trigger atualizar_assinatura_restaurante before update on public.assinaturas_restaurante for each row execute function public.atualizar_timestamp_planos_restaurante();
drop trigger if exists atualizar_cobranca_assinatura_restaurante on public.cobrancas_assinatura_restaurante;
create trigger atualizar_cobranca_assinatura_restaurante before update on public.cobrancas_assinatura_restaurante for each row execute function public.atualizar_timestamp_planos_restaurante();
drop trigger if exists atualizar_campanha_inteligente_restaurante on public.campanhas_inteligentes_restaurante;
create trigger atualizar_campanha_inteligente_restaurante before update on public.campanhas_inteligentes_restaurante for each row execute function public.atualizar_timestamp_planos_restaurante();

alter table public.planos_restaurante enable row level security;
alter table public.assinaturas_restaurante enable row level security;
alter table public.historico_assinaturas_restaurante enable row level security;
alter table public.cobrancas_assinatura_restaurante enable row level security;
alter table public.campanhas_inteligentes_restaurante enable row level security;
alter table public.campanhas_inteligentes_produtos enable row level security;
alter table public.resgates_campanha_inteligente enable row level security;
alter table public.eventos_campanha_inteligente enable row level security;
alter table public.consentimentos_ofertas_cliente enable row level security;
revoke all on public.planos_restaurante,public.assinaturas_restaurante,public.historico_assinaturas_restaurante,public.cobrancas_assinatura_restaurante,public.campanhas_inteligentes_restaurante,public.campanhas_inteligentes_produtos,public.resgates_campanha_inteligente,public.eventos_campanha_inteligente,public.consentimentos_ofertas_cliente from anon,authenticated;
grant select on public.consentimentos_ofertas_cliente to authenticated;
drop policy if exists "Cliente le consentimento de ofertas proprio" on public.consentimentos_ofertas_cliente;
create policy "Cliente le consentimento de ofertas proprio" on public.consentimentos_ofertas_cliente for select to authenticated using (id_cliente in (select id_cliente from public.clientes where id_auth = (select auth.uid())));

notify pgrst, 'reload schema';
commit;
