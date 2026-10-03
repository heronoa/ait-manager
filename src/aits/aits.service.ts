import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateAitDto } from './dto/create-ait.dto';
import { UpdateAitDto } from './dto/update-ait.dto';
import { MessageProducer } from 'src/sqs/producer/producer.service';

@Injectable()
export class AitsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sqsService: MessageProducer,
  ) {}

  async create(createAitDto: CreateAitDto) {
    let ait: Awaited<ReturnType<PrismaService['ait']['create']>>;
    try {
      ait = await this.prismaService.ait.create({ data: createAitDto });
    } catch (error) {
      throw new NotFoundException();
    }

    await this.sendAitCreationMessage(ait);
    return ait;
  }

  findAll() {
    return this.prismaService.ait.findMany({ include: { Cancelamento: true } });
  }

  findOne(id: string) {
    return this.prismaService.ait.findUnique({
      where: { id },
      include: { Cancelamento: true },
    });
  }

  async update(id: string, updateAitDto: UpdateAitDto) {
    try {
      return await this.prismaService.ait.update({
        where: {
          id,
        },
        data: updateAitDto,
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async remove(id: string) {
    try {
      return await this.prismaService.ait.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async sendAitCreationMessage(ait: {
    id: string;
    nome: string;
    nome_do_agente: string;
    nome_do_condutor: string;
  }) {
    await this.sqsService.sendMessage('AIT_CRIADA', {
      id: ait.id,
      nome: ait.nome,
      nome_do_agente: ait.nome_do_agente,
      nome_do_condutor: ait.nome_do_condutor,
    });
  }
}
