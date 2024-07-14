import { Prisma } from '@prisma/client';

export class Cancelamento implements Prisma.CancelamentoUncheckedCreateInput {
  id?: string;
  aceita: boolean;
  aitId: string;
  justificativa: string;
  parecer?: string;

  constructor(partial: Partial<Cancelamento>) {
    Object.assign(this, partial);
  }
}
