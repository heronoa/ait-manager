# Plano — Consumer SQS: ack após sucesso, long polling e DLQ

**Milestone:** m1-consumer
**Feature pai:** [sqs-consumer-hardening.index.md](./sqs-consumer-hardening.index.md)
**Criado em:** 2026-10-03
**Status:** aprovada

---

### 1. Objetivo

Substituir o cron por um loop de long polling que só apaga a mensagem depois que o handler de domínio processa com sucesso. O producer passa a enviar um envelope JSON `{ type, payload }`, com o `id` do AIT já persistido. O contrato exposto para a próxima milestone é a fábrica `createSqsClient()` e a variável `SQS_CONSUMER_ENABLED`.

---

### 2. Arquivos alterados

| Arquivo | Operação | O que muda |
|---------|----------|------------|
| `src/sqs/sqs-client.factory.ts` | criar | `createSqsClient()`: um único lugar que monta o `SQSClient` com `region`, credenciais das envs e `endpoint: process.env.AWS_ENDPOINT_URL \|\| undefined`. |
| `src/sqs/producer/producer.service.ts` | modificar | Usa a fábrica. `sendMessage(type, payload)` envia `MessageBody = JSON.stringify({ type, payload })` e `MessageAttributes.Type`. Remove `DelaySeconds` (era um paliativo para a corrida com o insert). Remove o `console.log(response)`. |
| `src/sqs/consumer/consumer.service.ts` | modificar | Remove `@Cron`. Loop de long polling com `AbortController`. `WaitTimeSeconds: 10`, `MaxNumberOfMessages: 10`, `VisibilityTimeout: 30`. Processa mensagens sequencialmente. Apaga em lote (`DeleteMessageBatchCommand`) só as que tiveram sucesso. Falha em `ReceiveMessage` gera backoff de 5s e log. Implementa `onApplicationBootstrap` (inicia, se `SQS_CONSUMER_ENABLED !== 'false'`) e `onModuleDestroy` (aborta e aguarda o loop terminar). |
| `src/sqs/consumer/message-dispatcher.ts` | criar | Faz o parse do envelope com `class-validator`/`class-transformer` e despacha por `type` para o handler registrado. Tipo desconhecido ou JSON inválido lança erro, então a mensagem não é apagada. |
| `src/sqs/consumer/handlers/ait-criada.handler.ts` | criar | Valida `payload.id` (string obrigatória). Busca o AIT via `PrismaService.ait.findUnique`. Se não existir, lança erro (retry). Se existir, retorna sem efeito colateral. |
| `src/sqs/consumer/consumer.module.ts` | modificar | Registra o dispatcher, o handler e o `PrismaService`. |
| `src/sqs/sqs.module.ts` | modificar | Remove `ScheduleModule.forRoot()`. |
| `src/aits/aits.service.ts` | modificar | `create`: `await` o insert, depois `await` o envio de `AIT_CRIADA` com `{ id, nome, nome_do_agente, nome_do_condutor }`. Se o envio falhar, o erro propaga (ver seção 6). |
| `src/aits/aits.service.spec.ts` | modificar | Ajusta a expectativa do `sqsMock.sendMessage` para o novo formato, e cobre a ordem: insert antes do envio. |
| `src/sqs/consumer/consumer.service.spec.ts` | criar | Testes unitários do loop (ver seção 4). |
| `src/sqs/consumer/message-dispatcher.spec.ts` | criar | Testes unitários do dispatcher. |
| `src/sqs/consumer/handlers/ait-criada.handler.spec.ts` | criar | Testes unitários do handler, com `PrismaService` mockado. |
| `package.json` | modificar | Remove `@nestjs/schedule`. Atualiza `yarn.lock` com `yarn remove`. |

---

### 3. Contrato da camada

- **`createSqsClient(): SQSClient`**: lê `AWS_REGION`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` e `AWS_ENDPOINT_URL`. Não lança exceção.
- **`MessageProducer.sendMessage(type: string, payload: object): Promise<SendMessageCommandOutput>`**: envia para `QUEUE_URL`. Propaga erros do SDK.
- **`MessageHandler` (consumer)**
  - `onApplicationBootstrap()`: inicia o loop se `SQS_CONSUMER_ENABLED !== 'false'`. Não bloqueia o bootstrap.
  - `onModuleDestroy()`: sinaliza o abort e aguarda o fim da iteração em andamento. Não deixa mensagens em processamento sem resolução.
  - Garantia: uma mensagem só é apagada se o handler resolveu sem erro. Qualquer erro (parse, tipo desconhecido, handler) deixa a mensagem na fila para redelivery.
- **`MessageDispatcher.dispatch(body: string): Promise<void>`**: lança `Error` para JSON inválido, envelope inválido ou tipo sem handler.
- **`AitCriadaHandler.handle(payload): Promise<void>`**: lança `Error` se o AIT não existir ou se o payload for inválido.
- **Configuração da DLQ** (provisionada na m2): `maxReceiveCount = 5`. Esta milestone não cria a fila.

**O que esta camada não faz:**
- Não cria filas nem DLQ. Isso é responsabilidade da m2.
- Não garante entrega exatamente uma vez. O handler precisa ser idempotente, e a verificação de existência já é.
- Não implementa outbox. Ver seção 6.

---

### 4. Testes previstos

**Unitários:**
- [ ] Consumer — mensagens recebidas com sucesso são apagadas em lote (`DeleteMessageBatch` com os `ReceiptHandle` corretos).
- [ ] Consumer — mensagem cujo handler lança erro não entra no lote de delete.
- [ ] Consumer — `ReceiveMessage` sem mensagens não chama delete e repete o polling.
- [ ] Consumer — falha em `ReceiveMessage` aguarda o backoff e continua o loop.
- [ ] Consumer — `SQS_CONSUMER_ENABLED=false` não chama `ReceiveMessage`.
- [ ] Consumer — `onModuleDestroy` interrompe o loop e resolve sem deixar promise pendente.
- [ ] Dispatcher — envelope válido chama o handler do `type` correspondente.
- [ ] Dispatcher — JSON inválido lança erro e não chama handler.
- [ ] Dispatcher — `type` desconhecido lança erro.
- [ ] Handler `AIT_CRIADA` — AIT existente resolve sem erro.
- [ ] Handler `AIT_CRIADA` — AIT inexistente lança erro.
- [ ] Handler `AIT_CRIADA` — payload sem `id` lança erro de validação.
- [ ] `AitsService.create` — o envio acontece depois do insert e com o `id` retornado.
- [ ] `AitsService.create` — erro no envio propaga (não é engolido).

**E2E:** não se aplica nesta milestone. Coberto na m3.

---

### 5. Dependências

Nenhuma. Os testes usam `SQSClient` e `PrismaService` mockados. Os valores de `VisibilityTimeout` e de `maxReceiveCount` precisam ser coerentes com a m2, mas isso não bloqueia a implementação.

---

### 6. Fora de escopo

- **Outbox pattern.** Se o SQS falhar depois do insert, o AIT existe sem mensagem. A milestone propaga o erro para não esconder o problema, mas não resolve a inconsistência. Fica registrado como trabalho futuro.
- **Concorrência paralela dentro do batch.** O processamento é sequencial. Paralelismo só se o volume justificar.
- **Ação de negócio real no handler.** `AIT_CRIADA` faz só a verificação de existência. Ver pontos a validar no index.
- **Mensagens inválidas apagadas direto.** Mensagens com JSON inválido não são apagadas. Elas passam pelo ciclo de retry e acabam na DLQ, o que deixa rastro para investigação.
