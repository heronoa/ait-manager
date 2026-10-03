import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { MessageHandler } from './consumer.service';
import { MessageDispatcher } from './message-dispatcher';

const QUEUE_URL = 'http://localhost:4566/000000000000/ait-manager';

const mockSend = jest.fn();

jest.mock('../sqs-client.factory', () => ({
  createSqsClient: () => ({ send: mockSend }),
}));

const msg = (id: string) => ({
  MessageId: `msg-${id}`,
  ReceiptHandle: `rh-${id}`,
  Body: JSON.stringify({ type: 'AIT_CRIADA', payload: { id } }),
});

const emptyReceive = () =>
  new Promise((resolve) => setTimeout(() => resolve({}), 5));

const sentCommands = <T>(command: new (...args: never[]) => T): T[] =>
  mockSend.mock.calls
    .map(([cmd]) => cmd)
    .filter((cmd): cmd is T => cmd instanceof command);

const receiveCalls = () => sentCommands(ReceiveMessageCommand).length;

const waitUntil = async (condition: () => boolean, timeoutMs = 1000) => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('condition not met in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

describe('MessageHandler (consumer)', () => {
  let consumer: MessageHandler;
  let dispatcher: { dispatch: jest.Mock };

  beforeEach(() => {
    process.env.QUEUE_URL = QUEUE_URL;
    delete process.env.SQS_CONSUMER_ENABLED;
    mockSend.mockReset();
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
    consumer = new MessageHandler(dispatcher as unknown as MessageDispatcher);
  });

  afterEach(async () => {
    await consumer.onModuleDestroy();
  });

  it('apaga em lote as mensagens processadas com sucesso', async () => {
    let receives = 0;
    mockSend.mockImplementation(async (cmd) => {
      if (cmd instanceof ReceiveMessageCommand) {
        receives++;
        return receives === 1
          ? { Messages: [msg('1'), msg('2')] }
          : emptyReceive();
      }
      return {};
    });

    consumer.onApplicationBootstrap();
    await waitUntil(() => sentCommands(DeleteMessageBatchCommand).length === 1);

    const [batch] = sentCommands(DeleteMessageBatchCommand);
    expect(batch.input).toEqual({
      QueueUrl: QUEUE_URL,
      Entries: [
        { Id: 'msg-1', ReceiptHandle: 'rh-1' },
        { Id: 'msg-2', ReceiptHandle: 'rh-2' },
      ],
    });
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(2);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(msg('1').Body);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(msg('2').Body);
  });

  it('não apaga a mensagem cujo processamento falhou', async () => {
    let receives = 0;
    mockSend.mockImplementation(async (cmd) => {
      if (cmd instanceof ReceiveMessageCommand) {
        receives++;
        return receives === 1
          ? { Messages: [msg('1'), msg('2')] }
          : emptyReceive();
      }
      return {};
    });
    dispatcher.dispatch.mockImplementation(async (body: string) => {
      if (body === msg('2').Body) throw new Error('falhou');
    });

    consumer.onApplicationBootstrap();
    await waitUntil(() => sentCommands(DeleteMessageBatchCommand).length === 1);

    const [batch] = sentCommands(DeleteMessageBatchCommand);
    expect(batch.input.Entries).toEqual([
      { Id: 'msg-1', ReceiptHandle: 'rh-1' },
    ]);
  });

  it('não envia delete quando nenhuma mensagem foi processada e continua o polling', async () => {
    mockSend.mockImplementation(async (cmd) => {
      if (cmd instanceof ReceiveMessageCommand) {
        return receiveCalls() === 1 ? { Messages: [msg('1')] } : emptyReceive();
      }
      return {};
    });
    dispatcher.dispatch.mockRejectedValue(new Error('falhou'));

    consumer.onApplicationBootstrap();
    await waitUntil(() => receiveCalls() >= 3);

    expect(sentCommands(DeleteMessageBatchCommand)).toHaveLength(0);
  });

  it('não apaga nada quando a fila não retorna mensagens', async () => {
    mockSend.mockImplementation(async (cmd) =>
      cmd instanceof ReceiveMessageCommand ? emptyReceive() : {},
    );

    consumer.onApplicationBootstrap();
    await waitUntil(() => receiveCalls() >= 3);

    expect(sentCommands(DeleteMessageBatchCommand)).toHaveLength(0);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('aguarda 5s após erro em ReceiveMessage antes de tentar de novo', async () => {
    jest.useFakeTimers();
    mockSend.mockImplementation(async (cmd) => {
      if (cmd instanceof ReceiveMessageCommand) {
        if (receiveCalls() === 1) throw new Error('boom');
        return new Promise((resolve) => setTimeout(() => resolve({}), 1000));
      }
      return {};
    });

    consumer.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);
    expect(receiveCalls()).toBe(1);

    await jest.advanceTimersByTimeAsync(4999);
    expect(receiveCalls()).toBe(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(receiveCalls()).toBe(2);

    const stopping = consumer.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(1000);
    await stopping;
    jest.useRealTimers();
  });

  it('onModuleDestroy interrompe o loop e não faz novas chamadas', async () => {
    mockSend.mockImplementation(async (cmd) =>
      cmd instanceof ReceiveMessageCommand ? emptyReceive() : {},
    );

    consumer.onApplicationBootstrap();
    await waitUntil(() => receiveCalls() >= 1);

    await consumer.onModuleDestroy();
    const callsAtStop = receiveCalls();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(receiveCalls()).toBe(callsAtStop);
  });

  it('não consome a fila quando SQS_CONSUMER_ENABLED=false', async () => {
    process.env.SQS_CONSUMER_ENABLED = 'false';
    mockSend.mockImplementation(async () => ({}));

    consumer.onApplicationBootstrap();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(receiveCalls()).toBe(0);
  });
});
