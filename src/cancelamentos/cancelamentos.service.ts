import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCancelamentoDto } from './dto/create-cancelamento.dto';
import { UpdateCancelamentoDto } from './dto/update-cancelamento.dto';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class CancelamentosService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createCancelamentoDto: CreateCancelamentoDto) {
    return this.prismaService.cancelamento.create({
      data: createCancelamentoDto,
    });
  }

  findAll() {
    return this.prismaService.cancelamento.findMany();
  }

  findOne(id: string) {
    return this.prismaService.cancelamento.findUnique({ where: { id } });
  }

  async update(id: string, updateCancelamentoDto: UpdateCancelamentoDto) {
    try {
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
