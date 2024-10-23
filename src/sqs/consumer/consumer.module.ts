import { Module } from '@nestjs/common';
import { MessageHandler } from './consumer.service';

@Module({
  imports: [],
  controllers: [],
  providers: [MessageHandler],
})
export class ConsumerModule {}
