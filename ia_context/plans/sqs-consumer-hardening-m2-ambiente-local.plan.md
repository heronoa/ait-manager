# Plano — Ambiente local com LocalStack e DLQ

**Milestone:** m2-ambiente-local
**Feature pai:** [sqs-consumer-hardening.index.md](./sqs-consumer-hardening.index.md)
**Criado em:** 2026-10-03
**Status:** aprovada

---

### 1. Objetivo

Permitir rodar o fluxo SQS completo localmente, sem conta AWS, com `docker compose up`. Ao final, a fila principal e a DLQ existem no LocalStack, com `RedrivePolicy` de `maxReceiveCount = 5`. O contrato exposto para a m3 é: `docker compose up -d` cria as filas, e as envs de `.env.example` apontam para elas.

---

### 2. Arquivos alterados

| Arquivo | Operação | O que muda |
|---------|----------|------------|
| `docker-compose.yml` | modificar | Adiciona o serviço `localstack` (imagem com tag major fixa, `SERVICES=sqs`, porta `4566`) e monta `./localstack/init/` em `/etc/localstack/init/ready.d/`. |
| `localstack/init/01-create-queues.sh` | criar | Cria a DLQ `ait-manager-dlq` primeiro, obtém o ARN, depois cria `ait-manager` com `RedrivePolicy` `{ deadLetterTargetArn, maxReceiveCount: 5 }`. Idempotente: não falha se as filas já existirem. Imprime a `QUEUE_URL`. |
| `.env.example` | modificar | Adiciona `AWS_ENDPOINT_URL`, `SQS_CONSUMER_ENABLED`, e valores de exemplo para o LocalStack (`AWS_REGION=us-east-1`, `ACCESS_KEY_ID=test`, `SECRET_ACCESS_KEY=test`, `QUEUE_URL` apontando para o LocalStack). Remove `QUEUE_NAME`, que não é usada. |
| `src/sqs/sqs-client.factory.ts` | verificar | Já criado na m1. Nenhuma mudança esperada aqui, a não ser que o teste manual revele necessidade de `forcePathStyle` ou ajuste de endpoint. |
| `README.md` | não alterar | Fica para a m3. |

---

### 3. Contrato da camada

- **Serviço `localstack`**: expõe SQS em `http://localhost:4566`. Após o healthcheck, as filas `ait-manager` e `ait-manager-dlq` existem.
- **Script de init**: idempotente. Se rodado de novo, não recria nem altera filas existentes. Os atributos da `RedrivePolicy` são os mesmos sempre.
- **Variáveis de ambiente esperadas pela aplicação**:
  - `AWS_ENDPOINT_URL` vazio em produção; `http://localhost:4566` localmente.
  - `QUEUE_URL` com a URL retornada pelo LocalStack.
- **Documentação de ambiente real**: a m3 documenta, no README, os comandos `aws sqs create-queue` para a DLQ e para a fila principal com `RedrivePolicy`, usando as mesmas configurações.

**O que esta camada não faz:**
- Não provisiona nada em AWS real. Os comandos de produção ficam documentados, não executados.
- Não gerencia o banco. O Postgres continua como está no compose.

---

### 4. Testes previstos

Não há testes automatizados nesta milestone. A verificação é manual e tem checklist:

- [ ] `docker compose up -d` sobe `database` e `localstack` sem erro.
- [ ] `awslocal sqs list-queues` lista `ait-manager` e `ait-manager-dlq`.
- [ ] `awslocal sqs get-queue-attributes --queue-url <url> --attribute-names RedrivePolicy` mostra `maxReceiveCount` 5 e o ARN da DLQ.
- [ ] Rodar o script de init uma segunda vez não falha e não altera as filas.
- [ ] Com `AWS_ENDPOINT_URL` apontando para o LocalStack, `MessageProducer.sendMessage` entrega uma mensagem visível via `awslocal sqs receive-message`.
- [ ] Com `AWS_ENDPOINT_URL` vazio, o cliente aponta para a AWS (checado pela configuração, sem chamada real).

---

### 5. Dependências

- m1 aprovado. A fábrica `createSqsClient()` e o envelope do producer são criados lá.

---

### 6. Fora de escopo

- **IaC (Terraform/CDK).** Escolha consciente para manter o escopo enxuto. Os comandos de produção ficam documentados no README (m3).
- **ElasticMQ ou outro emulador.** O LocalStack foi a escolha explícita.
- **Testcontainers.** O teste de integração usa o compose (m3). Não é adicionada dependência de desenvolvimento.
- **Redis, Postgres em outra versão, ou outros serviços AWS.** Só SQS é emulado.
