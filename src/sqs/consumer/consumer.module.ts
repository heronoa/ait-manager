import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { MessageHandler } from './messageHandler';
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
      consumers: [
        {
          name: config.QUEUE_NAME, // name of the queue
          queueUrl: config.QUEUE_URL, // the url of the queue
          region: config.AWS_REGION,
        },
      ],
      producers: [],
    }),
  ],
  controllers: [],
  providers: [MessageHandler],
})
export class ConsumerModule {}
