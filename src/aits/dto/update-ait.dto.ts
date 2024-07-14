import { Prisma } from '@prisma/client';
import { Ait } from '../entities/ait.entity';

export class UpdateAitDto extends Ait {
  id: string;
  nome: string;
  data: Date;
  nome_do_agente: string;
  nome_do_condutor: string;
  status: string;
  Cancelamento?: Prisma.CancelamentoUncheckedCreateNestedOneWithoutAitInput;

  super(partial: Partial<Ait>) {
    Object.assign(this, partial);
  }
}
