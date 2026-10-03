import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createSqsClient } from '../sqs-client.factory';

@Injectable()
export class MessageProducer {
  private client: SQSClient | null = null;

  async onModuleInit() {
    this.client = createSqsClient();
  }

  async sendMessage(type: string, payload: object) {
    const command = new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageAttributes: {
        Type: {
          DataType: 'String',
          StringValue: type,
        },
      },
      MessageBody: JSON.stringify({ type, payload }),
    });

    return this.client.send(command);
  }
}
