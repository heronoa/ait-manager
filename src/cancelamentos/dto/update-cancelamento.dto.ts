import { Cancelamento } from '../entities/cancelamento.entity';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateCancelamentoDto extends Cancelamento {
  super(partial: Partial<Cancelamento>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  aceita: boolean;
  @ApiProperty()
  aitId: string;
  @ApiProperty()
  justificativa: string;
  @ApiProperty()
  parecer: string;
}
