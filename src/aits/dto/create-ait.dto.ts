import { Prisma } from '@prisma/client';
import { Ait } from '../entities/ait.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAitDto extends Ait {
  super(partial: Partial<Ait>) {
    Object.assign(this, partial);
  }

  id?: string;
  @ApiProperty()
  nome: string;
  @ApiProperty({ default: new Date(Date.now()) })
  data?: Date;
  @ApiProperty()
  nome_do_agente: string;
  @ApiProperty()
  nome_do_condutor: string;
  @ApiProperty({ default: 'EM_PROCESSAMENTO' })
  status: string;

  Cancelamento?: Prisma.CancelamentoUncheckedCreateNestedOneWithoutAitInput;
}
