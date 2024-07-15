import { Module } from '@nestjs/common';
import { CancelamentosService } from './cancelamentos.service';
import { CancelamentosController } from './cancelamentos.controller';
import { AitsService } from 'src/aits/aits.service';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  controllers: [CancelamentosController],
  providers: [CancelamentosService, PrismaService, AitsService],
})
export class CancelamentosModule {}
