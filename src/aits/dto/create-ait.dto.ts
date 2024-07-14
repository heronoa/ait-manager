import { Prisma } from '@prisma/client';
import { Ait } from '../entities/ait.entity';

export class CreateAitDto extends Ait {
  super(partial: Partial<Ait>) {
    Object.assign(this, partial);
  }

  id?: string;
  nome: string;
  data: Date;
  nome_do_agente: string;
  nome_do_condutor: string;
  status: string;
  Cancelamento?: Prisma.CancelamentoUncheckedCreateNestedOneWithoutAitInput;
}
