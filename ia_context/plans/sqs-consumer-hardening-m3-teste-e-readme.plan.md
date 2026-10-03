# Plano — Teste de fluxo produtor → fila → consumidor e README

**Milestone:** m3-teste-e-readme
**Feature pai:** [sqs-consumer-hardening.index.md](./sqs-consumer-hardening.index.md)
**Criado em:** 2026-10-03
**Status:** revisão necessária

---

### 1. Objetivo

Provar, contra o LocalStack real, que uma mensagem enviada pelo producer é consumida pelo consumer, apagada após sucesso, e que uma falha leva a mensagem à DLQ depois de N tentativas. Substituir o e2e padrão do Nest por esse teste e reescrever o README com o estado real do projeto.

---

### 2. Arquivos alterados

| Arquivo | Operação | O que muda |
|---------|----------|------------|
| `test/app.e2e-spec.ts` | remover | Teste padrão do Nest, sem valor para este projeto. |
| `test/sqs-flow.e2e-spec.ts` | criar | Teste de fluxo (ver seção 4). Cria, em `beforeAll`, uma fila e uma DLQ com nomes aleatórios, e as remove em `afterAll`. Isso evita colisão com a fila de desenvolvimento. |
| `test/jest-e2e.json` | modificar | Adiciona `testTimeout` maior (filas SQS têm latência) e `moduleNameMapper` para `src/`, igual ao `package.json`. |
| `package.json` | modificar | Script `test:e2e:sqs` que roda o teste; `test:e2e` aponta para o novo arquivo. |
| `README.md` | reescrever | Ver seção 4, bloco README. |

---

### 3. Contrato da camada

- **Teste de fluxo**: exercita `MessageProducer`, a fila real, `MessageHandler` e `MessageDispatcher` com `PrismaService` mockado. O banco não faz parte do fluxo sob teste. Essa é uma decisão explícita, registrada aqui.
- **README**: descreve o que o projeto faz hoje, como subir o ambiente, como rodar testes, e os comandos de DLQ para ambiente real.

**O que esta camada não faz:**
- Não testa Postgres de ponta a ponta. Isso exigiria um e2e de HTTP com banco, fora deste escopo.
- Não declara resultado de avaliação técnica no README. Ele registra o histórico do projeto de forma neutra.

---

### 4. Testes previstos

**Teste de fluxo** (`test/sqs-flow.e2e-spec.ts`, requer `docker compose up -d localstack`):

- [ ] Caminho feliz — `sendMessage('AIT_CRIADA', { id })` → consumer processa → mensagem não está mais na fila (`ApproximateNumberOfMessages` e `NotVisible` zerados) e o handler foi chamado com o `id`.
- [ ] Falha de handler — `findUnique` retorna `null` → mensagem não é apagada → reaparece após o visibility timeout.
- [ ] Redrive para DLQ — com `maxReceiveCount` 2 na fila de teste, a mensagem com falha aparece na DLQ e não na fila principal.
- [ ] JSON inválido — corpo que não é JSON segue o mesmo caminho de retry até a DLQ.
- [ ] Consumer desligado — `SQS_CONSUMER_ENABLED=false` não consome a mensagem, que permanece na fila.

**README — conteúdo mínimo:**
- Cabeçalho: "technical assessment from 2024, revisited in 2026". Sem citar resultado.
- Visão geral e fluxo: API → SQS → consumer → Prisma/Postgres.
- Como rodar: `docker compose up -d`, copiar `.env.example`, `yarn install`, `yarn start:dev`.
- Testes: unitários, e2e (SQS) e como o e2e depende do LocalStack.
- Comandos de DLQ para AWS real (`aws sqs create-queue` com `RedrivePolicy`).
- Remoção do texto de boilerplate do Nest.

---

### 5. Dependências

- m1 aprovado: o consumer e o dispatcher existem e são testados em unidade.
- m2 aprovado: o LocalStack e a DLQ existem no compose.

---

### 6. Fora de escopo

- **Teste com Postgres real.** O banco é mockado no teste de fluxo, pela razão da seção 3.
- **Pipeline de CI.** Não é configurado aqui. O teste depende de Docker, e isso deve ser registrado no README.
- **Métricas e alertas sobre a DLQ.** Trabalho de operação, não de código.
- **Documentação de API (Swagger).** Não é alterada.
