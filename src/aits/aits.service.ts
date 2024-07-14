import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateAitDto } from './dto/create-ait.dto';
import { UpdateAitDto } from './dto/update-ait.dto';

@Injectable()
export class AitsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(createAitDto: CreateAitDto) {
    return this.prismaService.ait.create({ data: createAitDto });
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
}
