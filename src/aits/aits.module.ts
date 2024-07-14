import { Module } from '@nestjs/common';
import { AitsService } from './aits.service';
import { AitsController } from './aits.controller';
import { PrismaService } from 'src/db/prisma.service';

@Module({
  imports: [PrismaService],
  controllers: [AitsController],
  providers: [AitsService, PrismaService],
})
export class AitsModule {}
