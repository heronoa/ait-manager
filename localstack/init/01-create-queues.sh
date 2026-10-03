#!/bin/bash
# Cria a DLQ e a fila principal no LocalStack.
# Executado automaticamente pelo LocalStack em /etc/localstack/init/ready.d.
# Idempotente: create-queue com os mesmos atributos retorna a fila existente.
set -euo pipefail

QUEUE_NAME="ait-manager"
DLQ_NAME="ait-manager-dlq"
MAX_RECEIVE_COUNT=5

DLQ_URL=$(awslocal sqs create-queue --queue-name "$DLQ_NAME" --query QueueUrl --output text)
DLQ_ARN=$(awslocal sqs get-queue-attributes --queue-url "$DLQ_URL" \
  --attribute-names QueueArn --query Attributes.QueueArn --output text)

REQUEST_FILE=$(mktemp)
trap 'rm -f "$REQUEST_FILE"' EXIT
cat > "$REQUEST_FILE" <<JSON
{
  "QueueName": "$QUEUE_NAME",
  "Attributes": {
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"$MAX_RECEIVE_COUNT\"}"
  }
}
JSON

QUEUE_URL=$(awslocal sqs create-queue --cli-input-json "file://$REQUEST_FILE" \
  --query QueueUrl --output text)

echo "[init] DLQ: $DLQ_URL"
echo "[init] Fila: $QUEUE_URL (maxReceiveCount=$MAX_RECEIVE_COUNT)"
