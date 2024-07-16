import { Module } from '@nestjs/common';
import { ProducerModule } from './producer/producer.module';
import { ConsumerModule } from './consumer/consumer.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ProducerModule, ConsumerModule, ScheduleModule.forRoot()],
  exports: [ProducerModule, ConsumerModule],
})
export class SqsModule {}
