import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCancelamentoDto } from './dto/create-cancelamento.dto';
import { UpdateCancelamentoDto } from './dto/update-cancelamento.dto';
import { PrismaService } from 'src/db/prisma.service';
import { UpdateAitDto } from 'src/aits/dto/update-ait.dto';
import { AitsService } from 'src/aits/aits.service';

@Injectable()
export class CancelamentosService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly aitsService: AitsService,
  ) {}
  create(createCancelamentoDto: CreateCancelamentoDto) {
    return this.prismaService.cancelamento.create({
      data: createCancelamentoDto,
    });
  }

  findAll() {
    return this.prismaService.cancelamento.findMany({ include: { ait: true } });
  }

  findOne(id: string) {
    return this.prismaService.cancelamento.findUnique({
      where: { id },
      include: { ait: true },
    });
  }

  async update(id: string, updateCancelamentoDto: UpdateCancelamentoDto) {
    try {
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

      return await this.prismaService.cancelamento.update({
        where: { id },
        data: updateCancelamentoDto,
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async remove(id: string) {
    try {
      return await this.prismaService.cancelamento.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
