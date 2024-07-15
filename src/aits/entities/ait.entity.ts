import { Prisma } from '@prisma/client';

export class Ait implements Prisma.AitUncheckedCreateInput {
  id?: string;
  nome: string;
  data?: Date;
  nome_do_agente: string;
  nome_do_condutor: string;
  status: string;
  Cancelamento?: Prisma.CancelamentoUncheckedCreateNestedOneWithoutAitInput;

  constructor(partial: Partial<Ait>) {
    Object.assign(this, partial);
  }
}
