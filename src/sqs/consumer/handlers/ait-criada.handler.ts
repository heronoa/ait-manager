import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { TypedMessageHandler } from '../message-dispatcher';

@Injectable()
export class AitCriadaHandler implements TypedMessageHandler {
  readonly type = 'AIT_CRIADA';

  constructor(private readonly prismaService: PrismaService) {}

  async handle(payload: unknown): Promise<void> {
    const id = (payload as { id?: unknown })?.id;
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('AIT_CRIADA: payload.id é obrigatório');
    }

    const ait = await this.prismaService.ait.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!ait) {
      throw new Error(`AIT ${id} ainda não encontrado`);
    }
  }
}
