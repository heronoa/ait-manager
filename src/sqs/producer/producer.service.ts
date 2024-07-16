import { Injectable } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class MessageProducer {
  constructor(private readonly sqsService: SqsService) {}
  client;

  async onModuleInit() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
  }

  async sendMessage(title: string, details: string) {
    const command = new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      DelaySeconds: 10,
      MessageAttributes: {
        Title: {
          DataType: 'String',
          StringValue: title,
        },
      },
      MessageBody: details,
    });

    const response = await this.client.send(command);
    console.log(response);
    return response;
  }
}
