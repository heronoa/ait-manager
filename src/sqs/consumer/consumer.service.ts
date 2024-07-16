import { Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

@Injectable()
export class MessageHandler {
  constructor() {}

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

  receiveMessage = (queueUrl) =>
    this.client.send(
      new ReceiveMessageCommand({
        AttributeNames: ['All'],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['All'],
        QueueUrl: queueUrl,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 20,
      }),
    );

  @SqsMessageHandler(process.env.QUEUE_NAME, false)
  async handleMessage() {
    const queueUrl = process.env.QUEUE_URL;

    const { Messages } = await this.receiveMessage(queueUrl);

    if (!Messages) {
      return;
    }

    for (let index = 0; index < Messages.length; index++) {
      console.log('[SQS MESSAGE] ' + Messages[index]);
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
