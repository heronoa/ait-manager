import { Test, TestingModule } from '@nestjs/testing';
import { CancelamentosService } from './cancelamentos.service';
import { CreateCancelamentoDto } from './dto/create-cancelamento.dto';
import { UpdateCancelamentoDto } from './dto/update-cancelamento.dto';
import { PrismaService } from 'src/db/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Cancelamento } from './entities/cancelamento.entity';
import { MessageProducer } from 'src/sqs/producer/producer.service';
import { AitsService } from 'src/aits/aits.service';

const fakeCancelamentos: Cancelamento[] = [
  {
    id: '1',
    aceita: false,
    aitId: '1',
    justificativa: 'Não estava dirigindo aquele dia',
  },
  {
    id: '2',
    aceita: false,
    aitId: '1',
    justificativa: 'Não estava dirigindo aquele dia',
  },
  {
    id: '3',
    aceita: false,
    aitId: '1',
    justificativa: 'Não estava dirigindo aquele dia',
  },
];

// E depois nosso objeto de mock do Prisma, retornando os dados falsos
const prismaMock = {
  cancelamento: {
    create: jest.fn().mockReturnValue(fakeCancelamentos[0]),
    findMany: jest.fn().mockResolvedValue(fakeCancelamentos),
    findUnique: jest.fn().mockResolvedValue(fakeCancelamentos[0]),
    update: jest.fn().mockResolvedValue(fakeCancelamentos[0]),
    delete: jest.fn(), // O método delete não retorna nada
  },
};

const sqsMock = {
  sendMessage: jest.fn(),
};

describe('CancelamentoService', () => {
  let service: CancelamentosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelamentosService,
        AitsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MessageProducer, useValue: sqsMock },
      ],
    }).compile();

    service = module.get<CancelamentosService>(CancelamentosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it(`should return an array of cancelamentos`, async () => {
      const response = await service.findAll();

      expect(response).toEqual(fakeCancelamentos);
      expect(prisma.cancelamento.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.findMany).toHaveBeenCalledWith({
        include: { ait: true },
      });
    });
  });

  describe('findOne', () => {
    it(`should return a single cancelamento`, async () => {
      const response = await service.findOne('1');

      expect(response).toEqual(fakeCancelamentos[0]);
      expect(prisma.cancelamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { ait: true },
      });
    });

    it(`should return nothing when cancelamento is not found`, async () => {
      jest
        .spyOn(prisma.cancelamento, 'findUnique')
        .mockResolvedValue(undefined);

      const response = await service.findOne('99');

      expect(response).toBeUndefined();
      expect(prisma.cancelamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.findUnique).toHaveBeenCalledWith({
        where: { id: '99' },
        include: { ait: true },
      });
    });
  });

  describe('create', () => {
    it(`should create a new cancelamento`, async () => {
      const createFakeAit = new CreateCancelamentoDto(fakeCancelamentos[0]);

      const response = await service.create(createFakeAit);

      expect(response).toBe(fakeCancelamentos[0]);
      expect(prisma.cancelamento.create).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.create).toHaveBeenCalledWith({
        data: fakeCancelamentos[0],
      });
    });
  });

  describe('updateOne', () => {
    it(`should update a cancelamento`, async () => {
      const createFakeAit = new UpdateCancelamentoDto(fakeCancelamentos[0]);

      const response = await service.update('1', createFakeAit);

      expect(response).toEqual(fakeCancelamentos[0]);
      expect(prisma.cancelamento.update).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: fakeCancelamentos[0],
      });
    });

    it(`should return NotFoundException when no cancelamento is found`, async () => {
      const unexistingCancelamento = new UpdateCancelamentoDto({
        id: '42',
        aceita: false,
        aitId: '1',
        justificativa: 'Não estava dirigindo aquele dia',
        parecer: 'Alibi do condutor procede',
      });

      jest.spyOn(prisma.cancelamento, 'update').mockRejectedValue(new Error());

      try {
        await service.update('42', unexistingCancelamento);
      } catch (error) {
        expect(error).toEqual(new NotFoundException());
      }

      expect(prisma.cancelamento.update).toHaveBeenCalledWith({
        where: { id: '42' },
        data: unexistingCancelamento,
      });
    });
  });

  describe('deleteOne', () => {
    it(`should delete cancelamento and return empty body`, async () => {
      expect(await service.remove('1')).toBeUndefined();
      expect(prisma.cancelamento.delete).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it(`should return NotFoundException if cancelamento does not exist`, async () => {
      jest.spyOn(prisma.cancelamento, 'delete').mockRejectedValue(new Error());

      try {
        await service.remove('99');
      } catch (error) {
        expect(error).toEqual(new NotFoundException());
      }

      expect(prisma.cancelamento.delete).toHaveBeenCalledTimes(1);
      expect(prisma.cancelamento.delete).toHaveBeenCalledWith({
        where: { id: '99' },
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
