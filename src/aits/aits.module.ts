import { Module } from '@nestjs/common';
import { AitsService } from './aits.service';
import { AitsController } from './aits.controller';
import { PrismaService } from 'src/db/prisma.service';
import { MessageProducer } from 'src/sqs/producer/producer.service';
import { SqsModule } from '@ssut/nestjs-sqs';

@Module({
  imports: [SqsModule],
  controllers: [AitsController],
  providers: [AitsService, PrismaService, MessageProducer],
})
export class AitsModule {}
