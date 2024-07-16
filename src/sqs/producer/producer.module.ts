import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { MessageProducer } from './producer.service';

@Module({
  imports: [
    SqsModule.register({
      consumers: [],
      producers: [
        {
          name: process.env.QUEUE_NAME,
          queueUrl: process.env.QUEUE_URL,
          region: process.env.AWS_REGION,
        },
      ],
    }),
  ],
  controllers: [],
  providers: [MessageProducer],
  exports: [MessageProducer],
})
export class ProducerModule {}
