import { Module } from '@nestjs/common';
import { ProducerModule } from './producer/producer.module';

@Module({
  imports: [ProducerModule],
  exports: [ProducerModule],
})
export class SqsModule {}
