import { Module } from '@nestjs/common';
import { MessageProducer } from './producer.service';

@Module({
  controllers: [],
  providers: [MessageProducer],
  exports: [MessageProducer],
})
export class ProducerModule {}
