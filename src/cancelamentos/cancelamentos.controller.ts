import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CancelamentosService } from './cancelamentos.service';
import { CreateCancelamentoDto } from './dto/create-cancelamento.dto';
import { UpdateCancelamentoDto } from './dto/update-cancelamento.dto';
import { AitsService } from 'src/aits/aits.service';
import { UpdateAitDto } from 'src/aits/dto/update-ait.dto';

@Controller('cancelamentos')
export class CancelamentosController {
  constructor(
    private readonly cancelamentosService: CancelamentosService,
    private readonly aitsService: AitsService,
  ) {}

  @Post()
  create(@Body() createCancelamentoDto: CreateCancelamentoDto) {
    return this.cancelamentosService.create(createCancelamentoDto);
  }

  @Get()
  findAll() {
    return this.cancelamentosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cancelamentosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCancelamentoDto: UpdateCancelamentoDto,
  ) {
    if (updateCancelamentoDto.aceita === true) {
      const newAit = {
        status: 'CANCELADO',
        id: updateCancelamentoDto.aitId,
        nome: undefined,
        data: undefined,
        nome_do_agente: undefined,
        nome_do_condutor: undefined,
      };

      this.aitsService.update(
        updateCancelamentoDto.aitId,
        new UpdateAitDto(newAit),
      );
    }

    return this.cancelamentosService.update(id, updateCancelamentoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cancelamentosService.remove(id);
  }
}
