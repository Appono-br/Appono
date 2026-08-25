# Plano de piloto controlado

## Portoes de entrada

O piloto só começa após testes críticos passarem, estorno real ser validado, webhook idempotente estar aplicado, logs/alertas estarem ativos, backup restaurado em teste e documentos de privacidade revisados.

## Fases

1. Sandbox: equipe interna, contas de teste e repasse simulado.
2. Homologação: clientes convidados e cenários completos, ainda sem dinheiro real.
3. Produção limitada: 2 a 3 restaurantes, até 30 clientes convidados e suporte acompanhado.
4. Expansão: somente após duas semanas sem divergência financeira crítica.

## Limites iniciais

- Valor máximo por pedido: R$ 200.
- Exposição diária total: R$ 2.000.
- Um pedido ativo por reserva.
- Bloqueio automático de novos checkouts ao atingir limite ou detectar divergência.
- Canal de suporte com responsável de plantão durante horários do piloto.

## Criterios de parada

Interromper novos pagamentos diante de estorno indisponível, webhook sem processamento, divergência de saldo, vazamento de dados, indisponibilidade prolongada ou repetição de pedido. Preservar webhook e conciliação para operações já iniciadas.
