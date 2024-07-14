import { Test, TestingModule } from '@nestjs/testing';
import { CancelamentosController } from './cancelamentos.controller';
import { CancelamentosService } from './cancelamentos.service';
import { PrismaService } from 'src/db/prisma.service';

describe('CancelamentosController', () => {
  let controller: CancelamentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CancelamentosController],
      providers: [CancelamentosService, PrismaService],
    }).compile();

    controller = module.get<CancelamentosController>(CancelamentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
