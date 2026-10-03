# AIT Manager

> technical assessment from 2024, revisited in 2026

API em NestJS para cadastro e acompanhamento de Autos de Infração de Trânsito (AIT) e seus cancelamentos. Ao criar um AIT, a API publica uma mensagem em uma fila SQS; um consumer dentro da mesma aplicação recebe essa mensagem e a processa.

## Arquitetura

```
  POST /api/v1/aits
        │
        ▼
  AitsService.create ──► PostgreSQL (Prisma)
        │
        ▼  após o insert
  MessageProducer ──► SQS: ait-manager ──► MessageHandler (long polling)
                              │                   │
                              │                   ▼
                              │            MessageDispatcher ──► AitCriadaHandler
                              │                   │
                              │         sucesso: apaga a mensagem
                              │         falha:   mensagem volta para a fila
                              ▼
                       após 5 tentativas ──► SQS: ait-manager-dlq
```

- **Envelope das mensagens:** `{ "type": "AIT_CRIADA", "payload": { "id", "nome", "nome_do_agente", "nome_do_condutor" } }`.
- **Entrega:** a mensagem só é apagada depois que o handler conclui sem erro. Erros de parse, tipo desconhecido ou handler mantêm a mensagem na fila.
- **DLQ:** mensagens que falham `maxReceiveCount = 5` vezes são movidas para `ait-manager-dlq`.

## Pré-requisitos

- Node.js 20+ e Yarn
- Docker (para PostgreSQL e LocalStack)

## Configuração local

```bash
# 1. Sobe PostgreSQL e LocalStack (SQS + DLQ são criadas automaticamente)
$ docker compose up -d

# 2. Variáveis de ambiente
$ cp .env.example .env

# 3. Dependências e migrations
$ yarn install
$ npx prisma migrate deploy
```

O LocalStack executa `localstack/init/01-create-queues.sh` ao subir, criando a fila `ait-manager` e a DLQ `ait-manager-dlq`. Para conferir:

```bash
$ docker exec ait-manager-localstack awslocal sqs list-queues
```

> Se o serviço `database` falhar por conflito de porta (5432), há outro PostgreSQL rodando na máquina. Pare-o ou ajuste a porta no `docker-compose.yml` e no `DATABASE_URL`.

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão PostgreSQL usada pelo Prisma |
| `AWS_REGION` | Região do SQS |
| `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | Credenciais AWS (no LocalStack, qualquer valor) |
| `AWS_ENDPOINT_URL` | Endpoint customizado. Use `http://localhost:4566` localmente. **Em produção, deixe vazio.** |
| `QUEUE_URL` | URL da fila principal |
| `SQS_CONSUMER_ENABLED` | `false` desliga o consumer. A API continua publicando mensagens. |

## Executando a aplicação

```bash
# desenvolvimento
$ yarn start:dev

# produção
$ yarn build
$ yarn start:prod
```

A documentação Swagger, com todas as rotas e DTOs, fica em http://localhost:3000/api.

## Testes

```bash
# unitários
$ yarn test

# fluxo SQS de ponta a ponta (requer o LocalStack no ar)
$ yarn test:e2e:sqs

# cobertura
$ yarn test:cov
```

O teste de fluxo (`test/sqs-flow.e2e-spec.ts`) cria filas próprias por cenário e cobre:

- consumo, chamada do handler e exclusão da mensagem após sucesso;
- falha no handler, com a mensagem indo para a DLQ;
- mensagem que não é JSON válido, indo para a DLQ sem chamar o handler;
- consumer desligado por `SQS_CONSUMER_ENABLED=false`.

Os cenários de DLQ levam cerca de um minuto cada, porque dependem do visibility timeout (30s) e das duas tentativas. Não há banco de dados no teste de fluxo: o Prisma é substituído por um mock, porque o foco é a fila.

## Operação em AWS

O repositório não provisiona a infraestrutura de produção. Crie a DLQ e a fila principal com a mesma política de redrive usada no LocalStack:

```bash
# DLQ
$ aws sqs create-queue --queue-name ait-manager-dlq

# Fila principal, apontando para a DLQ
$ DLQ_ARN=$(aws sqs get-queue-attributes --queue-url <URL_DA_DLQ> \
    --attribute-names QueueArn --query Attributes.QueueArn --output text)

$ aws sqs create-queue --queue-name ait-manager --attributes \
    "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"5\"}"
```

Depois, configure `QUEUE_URL` com a URL da fila principal e deixe `AWS_ENDPOINT_URL` vazio.

## Limitações conhecidas

- Não há outbox: se o SQS falhar depois do insert no banco, o AIT é gravado sem a mensagem correspondente. A API responde com erro, mas o registro permanece.
- O handler `AIT_CRIADA` apenas verifica se o AIT existe. A ação de negócio associada ao evento ainda não foi definida.
