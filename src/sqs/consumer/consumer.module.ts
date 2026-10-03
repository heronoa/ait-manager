import { Module } from '@nestjs/common';
import { MessageHandler } from './consumer.service';
import { MESSAGE_HANDLERS, MessageDispatcher } from './message-dispatcher';
import { AitCriadaHandler } from './handlers/ait-criada.handler';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    MessageHandler,
    MessageDispatcher,
    AitCriadaHandler,
    PrismaService,
    {
      provide: MESSAGE_HANDLERS,
      useFactory: (aitCriada: AitCriadaHandler) => [aitCriada],
      inject: [AitCriadaHandler],
    },
  ],
})
export class ConsumerModule {}
