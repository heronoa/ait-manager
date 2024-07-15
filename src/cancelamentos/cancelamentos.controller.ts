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
import { Cancelamento } from './entities/cancelamento.entity';

@Controller('cancelamentos')
export class CancelamentosController {
  constructor(private readonly cancelamentosService: CancelamentosService) {}

  @Post()
  create(@Body() createCancelamentoDto: CreateCancelamentoDto) {
    return this.cancelamentosService.create(createCancelamentoDto);
  }

  @Get()
  findAll(): Promise<Cancelamento[]> {
    return this.cancelamentosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Cancelamento> {
    return this.cancelamentosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCancelamentoDto: UpdateCancelamentoDto,
  ) {
    return this.cancelamentosService.update(id, updateCancelamentoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cancelamentosService.remove(id);
  }
}
