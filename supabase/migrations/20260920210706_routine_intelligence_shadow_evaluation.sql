begin;

create table public.avaliacoes_sombra_rotina (
  id_avaliacao_sombra bigserial primary key,
  id_cliente bigint not null references public.clientes(id_cliente) on delete cascade,
  id_planejamento_rotina bigint not null references public.planejamentos_rotina(id_planejamento_rotina) on delete cascade,
  id_refeicao_planejada bigint not null references public.refeicoes_planejadas(id_refeicao_planejada) on delete cascade,
  modelo_controle text not null,
  modelo_desafiante text not null,
  id_restaurante_controle bigint references public.restaurantes(id_restaurante) on delete set null,
  id_produto_controle bigint references public.produtos(id_produto) on delete set null,
  pontuacao_controle numeric(8,2),
  id_restaurante_desafiante bigint references public.restaurantes(id_restaurante) on delete set null,
  id_produto_desafiante bigint references public.produtos(id_produto) on delete set null,
  pontuacao_desafiante numeric(8,2),
  confianca_desafiante numeric(4,3),
  amostras_desafiante integer not null default 0,
  divergiu boolean not null default false,
  aprovado_em timestamptz,
  recusado_em timestamptz,
  alternativa_solicitada_em timestamptz,
  editado_em timestamptz,
  convertido_reserva_em timestamptz,
  convertido_pedido_em timestamptz,
  feedback_positivo_em timestamptz,
  feedback_negativo_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint avaliacoes_sombra_modelos_check check (
    char_length(trim(modelo_controle)) between 2 and 80
    and char_length(trim(modelo_desafiante)) between 2 and 80
  ),
  constraint avaliacoes_sombra_confianca_check check (
    confianca_desafiante is null or confianca_desafiante between 0 and 1
  ),
  constraint avaliacoes_sombra_amostras_check check (amostras_desafiante between 0 and 100000),
  unique (id_refeicao_planejada, modelo_desafiante)
);

create index avaliacoes_sombra_cliente_criado_idx
  on public.avaliacoes_sombra_rotina (id_cliente, criado_em desc);
create index avaliacoes_sombra_modelos_resultado_idx
  on public.avaliacoes_sombra_rotina (modelo_controle, modelo_desafiante, divergiu, criado_em desc);
create index avaliacoes_sombra_planejamento_idx
  on public.avaliacoes_sombra_rotina (id_planejamento_rotina, id_refeicao_planejada);

create trigger set_updated_at_avaliacoes_sombra_rotina
before update on public.avaliacoes_sombra_rotina
for each row execute function public.set_atualizado_em();

alter table public.avaliacoes_sombra_rotina enable row level security;
revoke all on table public.avaliacoes_sombra_rotina from public, anon, authenticated;
grant all on table public.avaliacoes_sombra_rotina to service_role;
grant usage, select on sequence public.avaliacoes_sombra_rotina_id_avaliacao_sombra_seq to service_role;

comment on table public.avaliacoes_sombra_rotina is
  'Comparação privada entre o recomendador oficial e um modelo desafiante. Não expõe endereço, agenda, alergias ou preferências brutas.';

notify pgrst, 'reload schema';

commit;
