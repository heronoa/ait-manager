import {
  OnApplicationBootstrap,
  OnModuleDestroy,
  Injectable,
} from '@nestjs/common';
import {
  DeleteMessageBatchCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { createSqsClient } from '../sqs-client.factory';
import { MessageDispatcher } from './message-dispatcher';

const BACKOFF_MS = 5000;

@Injectable()
export class MessageHandler implements OnApplicationBootstrap, OnModuleDestroy {
  private client: SQSClient | null = null;
  private readonly abortController = new AbortController();
  private loop: Promise<void> | null = null;

  constructor(private readonly dispatcher: MessageDispatcher) {}

  onApplicationBootstrap() {
    if (process.env.SQS_CONSUMER_ENABLED === 'false') {
      console.log('[SQS MESSAGE] consumer desabilitado');
      return;
    }

    this.client = createSqsClient();
    this.loop = this.poll();
  }

  async onModuleDestroy() {
    this.abortController.abort();
    await this.loop;
  }

  private async poll(): Promise<void> {
    const { signal } = this.abortController;
    const queueUrl = process.env.QUEUE_URL;

    while (!signal.aborted) {
      try {
        const { Messages = [] } = await this.client.send(
          new ReceiveMessageCommand({
            AttributeNames: ['All'],
            MaxNumberOfMessages: 10,
            MessageAttributeNames: ['All'],
            QueueUrl: queueUrl,
            WaitTimeSeconds: 10,
            VisibilityTimeout: 30,
          }),
          { abortSignal: signal },
        );

        const processed = await this.processBatch(Messages);
        if (processed.length > 0) {
          await this.deleteBatch(queueUrl, processed);
        }
      } catch (error) {
        if (signal.aborted) break;
        console.error('[SQS MESSAGE] erro no polling, aguardando', error);
        await this.sleep(BACKOFF_MS);
      }
    }
  }

  private async processBatch(messages: Message[]): Promise<Message[]> {
    const processed: Message[] = [];

    for (const message of messages) {
      try {
        await this.dispatcher.dispatch(message.Body ?? '');
        processed.push(message);
      } catch (error) {
        console.error(`[SQS MESSAGE] falha em ${message.MessageId}`, error);
      }
    }

    return processed;
  }

  private async deleteBatch(queueUrl: string, messages: Message[]) {
    await this.client.send(
      new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: messages.map((message) => ({
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        })),
      }),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      this.abortController.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}
