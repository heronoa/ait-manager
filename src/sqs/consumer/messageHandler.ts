import { Injectable } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import * as AWS from 'aws-sdk';

const config = {
  QUEUE_NAME: process.env.QUEUE_NAME,
  QUEUE_URL: process.env.QUEUE_URL,
  AWS_REGION: process.env.AWS_REGION,
  ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};

console.log('config.AWS_REGION', config);
@Injectable()
export class MessageHandler {
  constructor() {}
  @SqsMessageHandler(config.QUEUE_NAME, false)
  async handleMessage(message: AWS.SQS.Message) {
    const obj: any = JSON.parse(message.Body) as {
      message: string;
      date: string;
    };
    const { data } = JSON.parse(obj.Message);

    return data;
    // use the data and consume it the way you want //
  }

  // @SqsMessageHandler(config.QUEUE_NAME, false)
  // async receiveMessages() {
  //   const messages = SQS.receiveMessages();
  // }
}
