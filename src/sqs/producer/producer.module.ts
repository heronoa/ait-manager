import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { MessageProducer } from './producer.service';
import * as AWS from 'aws-sdk';

const config = {
  QUEUE_NAME: process.env.QUEUE_NAME,
  QUEUE_URL: process.env.QUEUE_URL,
  AWS_REGION: process.env.AWS_REGION,
  ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};

AWS.config.update({
  region: config.AWS_REGION,
  accessKeyId: config.ACCESS_KEY_ID,
  secretAccessKey: config.SECRET_ACCESS_KEY,
});

@Module({
  imports: [
    SqsModule.register({
      consumers: [],
      producers: [
        {
          name: config.QUEUE_NAME,
          queueUrl: config.QUEUE_URL,
          region: config.AWS_REGION,
        },
      ],
    }),
  ],
  controllers: [],
  providers: [MessageProducer],
  exports: [MessageProducer],
})
export class ProducerModule {}
