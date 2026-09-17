# Revisão de UX — Appono Rotina

## Entrega

- A entrada da Rotina agora orienta a próxima decisão e mostra um checklist na primeira utilização.
- Preferências foi dividido em três etapas: horários, critérios e personalização.
- A etapa final oferece **Salvar para depois** e **Salvar e gerar minha semana**; a geração continua usando as versões e o fluxo transacional existentes.
- Minha Semana mostra um resumo de decisões pendentes, confirmações e próxima refeição.
- Ações foram ordenadas como escolher, ajustar, recusar e, somente após aprovação, reservar ou pedir. Aprovar não cria cobrança.

## Preservado

Recomendação, agenda, geocodificação, alergias, conflitos 409, rascunhos, conversão, reserva, pedido e pagamento não tiveram suas regras de negócio alteradas.

## Evidências

- `npm run lint --workspace frontend`: aprovado.
- `npm run build --workspace frontend`: aprovado.
- `npm test --workspace backend`: 106 testes aprovados antes desta camada exclusivamente visual; a alteração posterior não modificou backend.
- `git diff --check`: aprovado nas validações anteriores.

## Pendência de validação visual

Não houve navegador controlável disponível para autenticar, preencher o formulário e inspecionar os breakpoints 320, 390, 768, 1024 e 1440 em tema claro/escuro. Essa homologação deve ocorrer antes de publicação.
