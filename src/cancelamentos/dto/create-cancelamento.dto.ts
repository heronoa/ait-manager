import { Cancelamento } from '../entities/cancelamento.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCancelamentoDto extends Cancelamento {
  super(partial: Partial<Cancelamento>) {
    Object.assign(this, partial);
  }

  id?: string;

  @ApiProperty({ default: false })
  aceita: boolean;
  @ApiProperty()
  aitId: string;
  @ApiProperty()
  justificativa: string;
  @ApiProperty({ required: false })
  parecer?: string;
}
