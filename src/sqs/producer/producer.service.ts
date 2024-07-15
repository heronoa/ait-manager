import { Injectable } from '@nestjs/common';
import { SqsService } from '@ssut/nestjs-sqs';
import { config } from 'src/config';
@Injectable()
export class MessageProducer {
  constructor(private readonly sqsService: SqsService) {}
  async sendMessage(body) {
    const message: any = JSON.stringify(body);

    try {
      await this.sqsService.send(config.QUEUE_NAME, message);
    } catch (error) {
      console.log('error in producing image!', error);
    }
  }
}
