import { Cancelamento } from '../entities/cancelamento.entity';

export class CreateCancelamentoDto extends Cancelamento {
  super(partial: Partial<Cancelamento>) {
    Object.assign(this, partial);
  }

  id?: string;
  aceita: boolean;
  aitId: string;
  justificativa: string;
  parecer?: string;
}
