import { Test, TestingModule } from '@nestjs/testing';
import { CancelamentosController } from './cancelamentos.controller';
import { CancelamentosService } from './cancelamentos.service';
import { PrismaService } from 'src/db/prisma.service';
import { AitsService } from 'src/aits/aits.service';
import { MessageProducer } from 'src/sqs/producer/producer.service';

const sqsMock = {
  sendMessage: jest.fn(),
};

describe('CancelamentosController', () => {
  let controller: CancelamentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CancelamentosController],
      providers: [
        CancelamentosService,
        AitsService,
        PrismaService,
        { provide: MessageProducer, useValue: sqsMock },
      ],
    }).compile();

    controller = module.get<CancelamentosController>(CancelamentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
