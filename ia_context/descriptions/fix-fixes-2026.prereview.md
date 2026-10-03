# Pre-review — Consumer SQS endurecido: ack após sucesso, DLQ, LocalStack e teste de fluxo

**Branch:** `fix/fixes-2026`
**Gerado em:** 2026-10-03

> Uso do autor, antes de abrir o MR. Não vai para o revisor.

---

### 1. O que testar

Ordem do mais crítico para o menos crítico.

- **Fluxo feliz ponta a ponta.** Com `docker compose up -d localstack` no ar e `yarn start:dev` rodando, faça `POST /api/v1/aits` com um corpo válido (confirme a rota no Swagger em http://localhost:3000/api).
  → Resposta 201 com o AIT criado. O log deve mostrar a mensagem sendo recebida e processada. Depois, `docker exec ait-manager-localstack awslocal sqs receive-message --queue-url http://localhost:4566/000000000000/ait-manager` não deve retornar mensagens.

- **Envio falhando depois do insert.** Pare o LocalStack (`docker compose stop localstack`) e faça o mesmo `POST`.
  → Resposta 500. O AIT **está gravado** no banco (`GET /api/v1/aits` o lista). Esse é o comportamento documentado como limitação (sem outbox). Suba o LocalStack de novo depois.

- **Mensagem inválida vai para a DLQ.** Envie um corpo que não é JSON:
  `docker exec ait-manager-localstack awslocal sqs send-message --queue-url http://localhost:4566/000000000000/ait-manager --message-body 'x'`
  → Em cerca de um minuto, a mensagem aparece em `ait-manager-dlq` e não some da fila principal antes disso. Os logs devem mostrar a falha em cada tentativa.

- **AIT inexistente no handler.** Envie uma mensagem válida com `id` que não existe no banco:
  `docker exec ait-manager-localstack awslocal sqs send-message --queue-url http://localhost:4566/000000000000/ait-manager --message-body '{"type":"AIT_CRIADA","payload":{"id":"nao-existe"}}'`
  → Mensagem reaparece e, após as tentativas, vai para a DLQ.

- **Consumer desligado.** Com `SQS_CONSUMER_ENABLED=false` no `.env`, reinicie a API e faça `POST /api/v1/aits`.
  → AIT criado (201), mensagem fica na fila principal e não aparece nos logs de processamento.

- **Shutdown limpo.** Com a API rodando e consumer ativo, pressione Ctrl+C.
  → Processo encerra sem erro e sem travar por mais de alguns segundos (a long polling é cancelada pelo abort).

- **Mensagens antigas.** Se houver mensagens do formato antigo (texto livre) na fila de dev, elas devem ir para a DLQ após as tentativas. Confirme que isso é esperado para o time.

- **Testes automatizados.**
  - `yarn test` → 41 testes passando.
  - `yarn test:e2e:sqs` → 4 testes passando (cerca de 2 minutos, requer LocalStack no ar).

---

### 2. Checklist de código

- [ ] Tipagem correta, sem `any` não justificado (o único `as unknown as` é no mock do Prisma nos testes)
- [ ] Logs de operação do consumer (`[SQS MESSAGE]`) são intencionais. Confirme que o time aceita esse padrão, já que o projeto usa `console.log` como logger
- [ ] Sem código de debug esquecido (`MUTANT`, `console.log` de resposta do SQS, comentários do cron antigo)
- [ ] Contrato da camada respeitado para m1, m2 e m3 (ver seções 3 dos planos)
- [ ] Testes cobrem os cenários dos planos (loop, dispatcher, handler, ordem do `create`, fluxo e2e)
- [ ] Nenhuma alteração fora do escopo: `git diff master --stat` não tem arquivos inesperados
- [ ] `yarn lint` / `npx eslint` nos arquivos alterados sem erros
- [ ] `yarn build` (`nest build`) sem erros
- [ ] `.env.example` sem credenciais reais (só valores de LocalStack)
- [ ] `test/app.e2e-spec.ts` removido e não referenciado em nenhum lugar

---

### 3. Checklist de comportamento

**Criação de AIT**
- [ ] `POST /api/v1/aits` com corpo válido retorna 201 e o AIT aparece em `GET /api/v1/aits`
- [ ] A mensagem `AIT_CRIADA` chega à fila com o `id` correto (verificar no log ou com `receive-message`)

**Consumo**
- [ ] Mensagem válida é processada e removida da fila (contagem zera)
- [ ] Mensagem com falha de handler não é removida e vai para a DLQ após 5 tentativas
- [ ] Mensagem que não é JSON vai para a DLQ sem chamar o handler

**Configuração**
- [ ] `SQS_CONSUMER_ENABLED=false` impede o consumo sem impedir a publicação
- [ ] `AWS_ENDPOINT_URL` vazio aponta para a AWS (checado pelo código; não rode contra a AWS sem necessidade)

**Ambiente local**
- [ ] `docker compose up -d localstack` cria `ait-manager` e `ait-manager-dlq`
- [ ] Rodar o script de init de novo não altera as filas

**Limitações conhecidas (devem ser aceitas, não corrigidas neste MR)**
- [ ] SQS fora do ar após o insert → 500 com AIT gravado, sem mensagem
