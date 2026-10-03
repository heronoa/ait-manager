# Index — Endurecimento do consumer SQS

**Criado em:** 2026-10-03

## Contexto

Revisão enxuta do fluxo SQS do `ait-manager` (NestJS). Problemas confirmados no código atual:

- `src/sqs/consumer/consumer.service.ts`: `DeleteMessageCommand` / `DeleteMessageBatchCommand` estão comentados, então as mensagens nunca são apagadas e voltam a aparecer após o visibility timeout.
- O polling é um `@Cron(EVERY_5_SECONDS)` com `WaitTimeSeconds: 5`. Como o cron não espera a execução anterior, duas execuções podem se sobrepor.
- O consumer só loga. Não existe processamento de negócio.
- `src/aits/aits.service.ts` (`create`) envia a mensagem **antes** do `prisma.ait.create`, sem `await` e sem o `id` do AIT, que só existe após o insert.
- Não há DLQ, nem ambiente local sem conta AWS.
- `test/app.e2e-spec.ts` é o padrão do Nest (espera "Hello World!" e sobe o `AppModule` inteiro).
- O README é o boilerplate do Nest.

## Decisões adotadas

| # | Tema | Decisão |
|---|------|---------|
| 1 | Processamento | Handler de domínio por `type` no envelope JSON `{ type, payload }`, com payload validado. |
| 2 | DLQ | Provisionada por script de init do LocalStack, com `RedrivePolicy` e `maxReceiveCount = 5`. Comandos AWS CLI documentados para ambiente real. |
| 3 | Endpoint | `AWS_ENDPOINT_URL` lido do ambiente, via fábrica única de `SQSClient`. Vazio em produção. |
| 4 | Processo | Mesmo processo da API. Loop iniciado em `onApplicationBootstrap`, parado em `onModuleDestroy`. Desligável por `SQS_CONSUMER_ENABLED=false`. |
| 5 | Teste | Teste de fluxo contra LocalStack real via `docker compose`. Substitui o e2e padrão. |
| 6 | Formato | Index com três milestones por tema. |

## Milestones

### Backend:

| # | Plano | Status | PR |
|---|-------|--------|----|
| 1 | [sqs-consumer-hardening-m1-consumer.plan.md](./sqs-consumer-hardening-m1-consumer.plan.md) | [x] aprovado | — |
| 2 | [sqs-consumer-hardening-m2-ambiente-local.plan.md](./sqs-consumer-hardening-m2-ambiente-local.plan.md) | [x] aprovado | — |
| 3 | [sqs-consumer-hardening-m3-teste-e-readme.plan.md](./sqs-consumer-hardening-m3-teste-e-readme.plan.md) | [ ] revisão necessária | — |

## Pontos a validar antes de executar m1

1. **Ação de negócio do handler inicial.** O plano usa `AIT_CRIADA` com uma verificação de existência do AIT no banco (falha = retry = DLQ depois de N tentativas). É um placeholder que exercita o fluxo de erro. Se houver uma ação de negócio real desejada, ela substitui a verificação sem mudar o restante do plano.
2. **Consistência entre banco e fila.** O envio é feito após o insert, mas se o SQS falhar depois do insert, o AIT existe sem mensagem. Corrigir isso exige outbox pattern, que está fora deste escopo (ver m1, seção 6).

## Notas de dependência

- m1 não depende de nada. Os testes unitários usam `SQSClient` mockado.
- m2 pode começar após m1 aprovado, ou em paralelo se o revisor preferir, porque só adiciona infraestrutura e a fábrica de clientes.
- m3 depende de m1 e m2 aprovados. O teste de fluxo precisa do consumer real e do LocalStack.
- Pela regra de backend, cada milestone só é executada depois da anterior estar aprovada.
