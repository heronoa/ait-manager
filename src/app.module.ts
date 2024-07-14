import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AitsModule } from './aits/aits.module';
import { PrismaService } from './db/prisma.service';
import { CancelamentosModule } from './cancelamentos/cancelamentos.module';

@Module({
  imports: [AitsModule, CancelamentosModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
