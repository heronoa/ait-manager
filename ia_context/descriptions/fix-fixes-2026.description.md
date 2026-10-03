# MR — Consumer SQS endurecido: ack após sucesso, DLQ, LocalStack e teste de fluxo

**Branch:** `fix/fixes-2026`
**Comparação base:** `master`
**Milestones:** m1-consumer, m2-ambiente-local, m3-teste-e-readme
**Plano:** [sqs-consumer-hardening.index.md](../plans/sqs-consumer-hardening.index.md)
**Data:** 2026-10-03

---

### 1. O que esse MR entrega

Mensagens publicadas na fila SQS agora só saem da fila depois de processadas com sucesso. Antes, o consumer nunca apagava nada: as mensagens voltavam a aparecer a cada visibility timeout e o polling por cron podia se sobrepor. Agora o consumer faz long polling em loop, chama um handler por tipo de mensagem (`AIT_CRIADA`) e apaga em lote apenas o que foi processado. Falhas repetidas (5 tentativas) movem a mensagem para uma DLQ, então nada se perde silenciosamente.

O envio de `AIT_CRIADA` passou a acontecer depois do insert no banco, com o `id` persistido. Antes, a mensagem era enviada antes do insert, sem `await` e sem o `id`. Como consequência, se o SQS falhar depois do insert, o erro agora chega ao cliente (500), em vez de ser engolido. O AIT fica gravado sem mensagem nesse caso: isso é uma limitação conhecida, que um outbox resolveria e que não está neste MR.

O ambiente local ganhou LocalStack no `docker-compose`, com fila e DLQ criadas automaticamente. O fluxo produtor → fila → consumidor é coberto por um teste de integração contra o LocalStack real. O README foi reescrito com o estado atual do projeto.

Implementação seguiu o plano aprovado em todos os três milestones. Uma diferença de comportamento que não estava explícita no plano: o `create` retorna erro quando o envio falha (ver seção 4).

---

### 2. O que mudou e por quê

| Arquivo | O que mudou | Por que importa |
|---------|-------------|-----------------|
| `src/sqs/consumer/consumer.service.ts` | `@Cron` substituído por loop de long polling com `AbortController`. Delete em lote só das mensagens processadas. Backoff de 5s em erro de receive. Para no `onModuleDestroy`. | Mensagem não processada não some. Polling não se sobrepõe. Shutdown não deixa processamento pendente. |
| `src/sqs/consumer/message-dispatcher.ts` (novo) | Valida o envelope `{ type, payload }` e despacha por `type`. | JSON inválido, envelope incompleto ou tipo desconhecido lançam erro, então a mensagem não é apagada e vai para a DLQ. |
| `src/sqs/consumer/handlers/ait-criada.handler.ts` (novo) | Valida `payload.id` e verifica se o AIT existe no banco. | Exercita o caminho de erro ponta a ponta: AIT ausente → retry → DLQ. Ação de negócio ainda não definida (ver seção 3). |
| `src/sqs/producer/producer.service.ts` | Envia `{ type, payload }` em JSON. Remove `DelaySeconds` e o `console.log` da resposta. | Formato único para o consumer. `DelaySeconds` era paliativo para a corrida com o insert, que deixou de existir. |
| `src/sqs/sqs-client.factory.ts` (novo) | Fábrica única de `SQSClient`, com `endpoint` vindo de `AWS_ENDPOINT_URL`. | Mesmo cliente em produção e no LocalStack. Vazio em produção = AWS real. |
| `src/aits/aits.service.ts` | `create` aguarda o insert e depois envia `AIT_CRIADA` com `id`, `nome`, `nome_do_agente` e `nome_do_condutor`. | Mensagem só existe se o AIT existe. Erro de envio propaga. |
| `src/sqs/sqs.module.ts`, `consumer.module.ts` | `ScheduleModule` removido. Dispatcher, handler e `PrismaService` registrados no consumer. | Sem cron, sem dependência de `@nestjs/schedule` (removida de `package.json` e `yarn.lock`). |
| `docker-compose.yml` | Serviço `localstack` (SQS, porta 4566) com `localstack/init` montado. | Roda sem conta AWS. |
| `localstack/init/01-create-queues.sh` (novo) | Cria DLQ e fila principal com `RedrivePolicy` `maxReceiveCount = 5`. Idempotente. | Mesma política de redrive que será aplicada em produção (comandos no README). |
| `.env.example` | `AWS_ENDPOINT_URL`, `QUEUE_URL`, `SQS_CONSUMER_ENABLED` e valores do LocalStack. Remove `QUEUE_NAME`, que não era usada. | Configuração local pronta para copiar. |
| `test/sqs-flow.e2e-spec.ts` (novo) | Quatro cenários contra o LocalStack: caminho feliz, falha → DLQ, JSON inválido → DLQ, consumer desligado. Cada teste cria filas próprias. | Prova o contrato de entrega, não só a unidade. |
| `test/app.e2e-spec.ts` | Removido. | Era o e2e padrão do Nest: subia o `AppModule` inteiro e esperava "Hello World!". |
| `test/jest-e2e.json` | `moduleNameMapper` para `src/` e `testTimeout` de 150s. | Permite importar o código de produção no e2e. |
| `package.json` / `yarn.lock` | `test:e2e:sqs` adicionado. `@nestjs/schedule` removido. | Script dedicado ao fluxo SQS. |
| `src/aits/aits.service.spec.ts`, `src/sqs/consumer/*.spec.ts`, `handlers/*.spec.ts` | 20 testes novos, cobrindo loop, dispatcher, handler e ordem do envio no `create`. | Suíte unitária: 21 → 41, todos passando. |
| `README.md` | Reescrito: arquitetura, configuração local, variáveis, testes, comandos de DLQ para AWS real, limitações. | Documentação do estado atual, no lugar do boilerplate do Nest. |
| `ia_context/` | Índice e planos dos três milestones. | Registro da decisão e da ordem de execução. |

---

### 3. O que este MR não entrega

- **Outbox.** Se o SQS falhar depois do insert, o AIT fica gravado sem mensagem. Está documentado no README e no plano como trabalho futuro.
- **Ação de negócio do `AIT_CRIADA`.** O handler só confirma que o AIT existe. A ação que o evento deve disparar ainda não foi definida.
- **Provisionamento de produção.** A DLQ e a fila principal em AWS são documentadas em comandos no README, não criadas por IaC.
- **CI para o teste de fluxo.** O `test:e2e:sqs` depende de Docker com o LocalStack no ar. Não está configurado em pipeline.

---

### 4. Notas para o revisor

- **Mudança de comportamento no `create`.** Antes, falhas de envio eram engolidas e o `create` respondia normalmente. Agora um erro do SQS responde 500 com o AIT já gravado. Foi a escolha do plano (não esconder a falha), mas merece atenção na revisão.
- **Mensagens antigas.** Mensagens publicadas pela versão anterior têm corpo em texto livre (`Nova Auto Infração de Trânsito...`), não JSON. O novo consumer não consegue parsear essas mensagens e elas irão para a DLQ após 5 tentativas. **Antes do deploy, esvazie a fila (ou deixe a versão antiga consumir até zerar).** Não há código de compatibilidade para o formato antigo.
- **Consumer roda dentro da API por padrão.** Em instâncias que só servem HTTP, defina `SQS_CONSUMER_ENABLED=false`. Com várias réplicas que consomem, o long polling é distribuído pela própria SQS.
- **`AWS_ENDPOINT_URL` em produção.** Deve ficar vazio. O `.env.example` aponta para o LocalStack, então não copie os valores de exemplo para produção sem ajustar.
- **Testes de DLQ são lentos.** Os dois cenários de DLQ levam cerca de um minuto cada, por causa do visibility timeout de 30s do consumer.
- **`ia_context/` está no diff.** Os planos e o index fazem parte deste MR; podem ser removidos antes do merge se o time não quiser versioná-los.
