import { Module } from '@nestjs/common';
import { CancelamentosService } from './cancelamentos.service';
import { CancelamentosController } from './cancelamentos.controller';

@Module({
  controllers: [CancelamentosController],
  providers: [CancelamentosService],
})
export class CancelamentosModule {}
