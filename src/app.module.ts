import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './db/prisma.service';
import { AitsController } from './aits/aits.controller';
import { CancelamentosController } from './cancelamentos/cancelamentos.controller';
import { AitsService } from './aits/aits.service';
import { CancelamentosService } from './cancelamentos/cancelamentos.service';
import { SqsModule } from './sqs/sqs.module';

@Module({
  controllers: [AppController, AitsController, CancelamentosController],
  providers: [AppService, PrismaService, AitsService, CancelamentosService],
  imports: [SqsModule],
})
export class AppModule {}
