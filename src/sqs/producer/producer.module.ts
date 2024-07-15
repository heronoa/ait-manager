import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { MessageProducer } from './producer.service';
import * as AWS from 'aws-sdk';
import { config } from 'src/config';

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
