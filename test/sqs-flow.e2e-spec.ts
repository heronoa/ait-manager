import {
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueAttributesCommand,
  ListQueuesCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../src/db/prisma.service';
import { MessageHandler } from '../src/sqs/consumer/consumer.service';
import { MessageDispatcher } from '../src/sqs/consumer/message-dispatcher';
import { AitCriadaHandler } from '../src/sqs/consumer/handlers/ait-criada.handler';
import { MessageProducer } from '../src/sqs/producer/producer.service';
import { createSqsClient } from '../src/sqs/sqs-client.factory';

// Usa o LocalStack do docker-compose. Os valores padrão batem com .env.example.
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || 'test';
process.env.SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY || 'test';
process.env.AWS_ENDPOINT_URL =
  process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const ACCOUNT_ID = '000000000000';
const endpoint = process.env.AWS_ENDPOINT_URL;
const sqs = createSqsClient();

interface TestQueues {
  queueUrl: string;
  dlqUrl: string;
}

// Cada teste cria a própria fila e DLQ, para não depender de estado anterior.
const createTestQueues = async (): Promise<TestQueues> => {
  const suffix = randomUUID().slice(0, 8);
  const queueName = `ait-test-${suffix}`;
  const dlqName = `ait-test-${suffix}-dlq`;

  const dlq = await sqs.send(new CreateQueueCommand({ QueueName: dlqName }));
  const { Attributes } = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: dlq.QueueUrl,
      AttributeNames: ['QueueArn'],
    }),
  );

  await sqs.send(
    new CreateQueueCommand({
      QueueName: queueName,
      Attributes: {
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: Attributes.QueueArn,
          maxReceiveCount: '2',
        }),
      },
    }),
  );

  return {
    queueUrl: `${endpoint}/${ACCOUNT_ID}/${queueName}`,
    dlqUrl: dlq.QueueUrl,
  };
};

// Mensagens visíveis + em voo: zero significa que a fila está vazia.
const countMessages = async (queueUrl: string): Promise<number> => {
  const { Attributes } = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
      ],
    }),
  );
  return (
    Number(Attributes?.ApproximateNumberOfMessages ?? 0) +
    Number(Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0)
  );
};

const waitFor = async (
  condition: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 500,
) => {
  const start = Date.now();
  while (!(await condition())) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`condição não atingida em ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
};

describe('Fluxo SQS: produtor → fila → consumidor (LocalStack)', () => {
  let queues: TestQueues;
  let producer: MessageProducer;
  let consumer: MessageHandler;
  let prisma: { ait: { findUnique: jest.Mock } };
  const originalQueueUrl = process.env.QUEUE_URL;

  beforeAll(async () => {
    try {
      await sqs.send(new ListQueuesCommand({}));
    } catch {
      throw new Error(
        `LocalStack indisponível em ${endpoint}. Rode: docker compose up -d localstack`,
      );
    }
  });

  beforeEach(async () => {
    queues = await createTestQueues();
    process.env.QUEUE_URL = queues.queueUrl;
    delete process.env.SQS_CONSUMER_ENABLED;

    prisma = { ait: { findUnique: jest.fn() } };
    const dispatcher = new MessageDispatcher([
      new AitCriadaHandler(prisma as unknown as PrismaService),
    ]);
    consumer = new MessageHandler(dispatcher);

    producer = new MessageProducer();
    await producer.onModuleInit();
  });

  afterEach(async () => {
    await consumer.onModuleDestroy();
    await sqs.send(new DeleteQueueCommand({ QueueUrl: queues.queueUrl }));
    await sqs.send(new DeleteQueueCommand({ QueueUrl: queues.dlqUrl }));
  });

  afterAll(() => {
    process.env.QUEUE_URL = originalQueueUrl;
    sqs.destroy();
  });

  it('consome a mensagem, chama o handler e apaga a mensagem após sucesso', async () => {
    prisma.ait.findUnique.mockResolvedValue({ id: 'ait-1' });

    const sent = await producer.sendMessage('AIT_CRIADA', { id: 'ait-1' });
    expect(sent.MessageId).toBeDefined();

    consumer.onApplicationBootstrap();

    await waitFor(
      async () =>
        prisma.ait.findUnique.mock.calls.length === 1 &&
        (await countMessages(queues.queueUrl)) === 0,
      30000,
    );

    expect(prisma.ait.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ait-1' } }),
    );
    expect(await countMessages(queues.dlqUrl)).toBe(0);
  });

  it('falha no handler faz a mensagem reaparecer e ir para a DLQ', async () => {
    prisma.ait.findUnique.mockResolvedValue(null);

    await producer.sendMessage('AIT_CRIADA', { id: 'ait-inexistente' });
    consumer.onApplicationBootstrap();

    await waitFor(
      async () => (await countMessages(queues.dlqUrl)) === 1,
      120000,
    );

    expect(prisma.ait.findUnique.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(await countMessages(queues.queueUrl)).toBe(0);
  }, 150000);

  it('mensagem que não é JSON válido vai para a DLQ sem chamar o handler', async () => {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queues.queueUrl,
        MessageBody: 'não é json',
      }),
    );
    consumer.onApplicationBootstrap();

    await waitFor(
      async () => (await countMessages(queues.dlqUrl)) === 1,
      120000,
    );

    expect(prisma.ait.findUnique).not.toHaveBeenCalled();
  }, 150000);

  it('não consome a fila quando SQS_CONSUMER_ENABLED=false', async () => {
    process.env.SQS_CONSUMER_ENABLED = 'false';
    prisma.ait.findUnique.mockResolvedValue({ id: 'ait-1' });

    await producer.sendMessage('AIT_CRIADA', { id: 'ait-1' });
    consumer.onApplicationBootstrap();
    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(prisma.ait.findUnique).not.toHaveBeenCalled();
    expect(await countMessages(queues.queueUrl)).toBe(1);
  });
});
