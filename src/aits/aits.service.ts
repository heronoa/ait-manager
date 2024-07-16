import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    try {
      this.sendAitCreationMessage(JSON.stringify(createAitDto));
      return await this.prismaService.ait.create({ data: createAitDto });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  findAll() {
    return this.prismaService.ait.findMany();
  }

  findOne(id: string) {
    return this.prismaService.ait.findUnique({ where: { id } });
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

  async sendAitCreationMessage(detalhes: string) {
    try {
      const message = 'Nova Auto Infração de Trânsito \n Detalhes: ' + detalhes;

      this.sqsService.sendMessage('Nova Auto Infração de Trânsito', message);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
