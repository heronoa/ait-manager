import { Injectable } from '@nestjs/common';
import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MessageHandler {
  constructor() {}

  private client: SQSClient | null = null;

  async onModuleInit() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
  }

  receiveMessage = (queueUrl) =>
    this.client.send(
      new ReceiveMessageCommand({
        AttributeNames: ['All'],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['All'],
        QueueUrl: queueUrl,
        WaitTimeSeconds: 5,
        VisibilityTimeout: 20,
      }),
    );

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleMessage() {
    const queueUrl = process.env.QUEUE_URL;

    const { Messages } = await this.receiveMessage(queueUrl);

    if (!Messages) {
      console.log('[SQS MESSAGE] No messages find');
      return;
    }

    console.log('[SQS MESSAGE] New Messages: ', Messages.length);
    for (let index = 0; index < Messages.length; index++) {
      console.log('[SQS MESSAGE] ' + JSON.stringify(Messages[index]));
    }

    // if (Messages.length === 1) {
    //   console.log(Messages[0].Body);
    //   await this.client.send(
    //     new DeleteMessageCommand({
    //       QueueUrl: queueUrl,
    //       ReceiptHandle: Messages[0].ReceiptHandle,
    //     }),
    //   );
    // } else {
    //   await this.client.send(
    //     new DeleteMessageBatchCommand({
    //       QueueUrl: queueUrl,
    //       Entries: Messages.map((message) => ({
    //         Id: message.MessageId,
    //         ReceiptHandle: message.ReceiptHandle,
    //       })),
    //     }),
    //   );
    // }
  }
}
