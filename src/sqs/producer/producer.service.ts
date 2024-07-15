import { Injectable } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { randomUUID } from 'crypto';

const config = {
  QUEUE_NAME: process.env.QUEUE_NAME,
  QUEUE_URL: process.env.QUEUE_URL,
  AWS_REGION: process.env.AWS_REGION,
  ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};
@Injectable()
export class MessageProducer {
  constructor(private readonly sqsService: SqsService) {}

  async sendMessage(body) {
    const message: any = JSON.stringify(body);

    try {
      await this.sqsService.send(config.QUEUE_NAME, {
        id: randomUUID(),
        body: message,
      });
    } catch (error) {
      console.log('error in producing message', error);
    }
  }
}
