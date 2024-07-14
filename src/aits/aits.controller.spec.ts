import { Test, TestingModule } from '@nestjs/testing';
import { AitsController } from './aits.controller';
import { AitsService } from './aits.service';
import { PrismaService } from 'src/db/prisma.service';

describe('AitsController', () => {
  let controller: AitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AitsController],
      providers: [AitsService, PrismaService],
    }).compile();

    controller = module.get<AitsController>(AitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
