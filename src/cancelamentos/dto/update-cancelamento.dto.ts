import { Cancelamento } from '../entities/cancelamento.entity';

export class UpdateCancelamentoDto extends Cancelamento {
  super(partial: Partial<Cancelamento>) {
    Object.assign(this, partial);
  }

  id: string;
  aceita: boolean;
  aitId: string;
  justificativa: string;
}
