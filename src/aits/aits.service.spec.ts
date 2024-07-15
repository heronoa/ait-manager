import { Test, TestingModule } from '@nestjs/testing';
import { AitsService } from './aits.service';
import { PrismaService } from 'src/db/prisma.service';
import { Ait } from './entities/ait.entity';
import { CreateAitDto } from './dto/create-ait.dto';
import { UpdateAitDto } from './dto/update-ait.dto';
import { NotFoundException } from '@nestjs/common';
import { MessageProducer } from 'src/sqs/producer/producer.service';

const fakeAits: Ait[] = [
  {
    id: '1',
    nome: 'não utilizar cinto de segurança',
    data: new Date(Date.now()),
    nome_do_agente: 'Marco Aurelio',
    nome_do_condutor: 'João da Silva',
    status: 'EM_ANDAMENTO',
  },
  {
    id: '2',
    nome: 'não utilizar cinto de segurança',
    data: new Date(Date.now() - 86400),
    nome_do_agente: 'Marco Aurelio',
    nome_do_condutor: 'João da Silva',
    status: 'EM_ANDAMENTO',
  },
  {
    id: '3',
    nome: 'não utilizar cinto de segurança',
    data: new Date(Date.now() - 2 * 86400),
    nome_do_agente: 'Marco Aurelio',
    nome_do_condutor: 'João da Silva',
    status: 'EM_ANDAMENTO',
  },
];

// E depois nosso objeto de mock do Prisma, retornando os dados falsos
const prismaMock = {
  ait: {
    create: jest.fn().mockReturnValue(fakeAits[0]),
    findMany: jest.fn().mockResolvedValue(fakeAits),
    findUnique: jest.fn().mockResolvedValue(fakeAits[0]),
    update: jest.fn().mockResolvedValue(fakeAits[0]),
    delete: jest.fn(), // O método delete não retorna nada
  },
};

const sqsMock = {
  sendMessage: jest.fn(),
};

describe('AitsService', () => {
  let service: AitsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AitsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MessageProducer, useValue: sqsMock },
      ],
    }).compile();

    service = module.get<AitsService>(AitsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it(`should return an array of aits`, async () => {
      const response = await service.findAll();

      expect(response).toEqual(fakeAits);
      expect(prisma.ait.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.ait.findMany).toHaveBeenCalledWith(/* nothing */);
    });
  });

  describe('findOne', () => {
    it(`should return a single ait`, async () => {
      const response = await service.findOne('1');

      expect(response).toEqual(fakeAits[0]);
      expect(prisma.ait.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.ait.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it(`should return nothing when ait is not found`, async () => {
      jest.spyOn(prisma.ait, 'findUnique').mockResolvedValue(undefined);

      const response = await service.findOne('99');

      expect(response).toBeUndefined();
      expect(prisma.ait.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.ait.findUnique).toHaveBeenCalledWith({
        where: { id: '99' },
      });
    });
  });

  describe('create', () => {
    it(`should create a new ait`, async () => {
      const createFakeAit = new CreateAitDto(fakeAits[0]);

      const response = await service.create(createFakeAit);

      expect(response).toBe(fakeAits[0]);
      expect(prisma.ait.create).toHaveBeenCalledTimes(1);
      expect(prisma.ait.create).toHaveBeenCalledWith({
        data: fakeAits[0],
      });
    });
  });

  describe('updateOne', () => {
    it(`should update a ait`, async () => {
      const createFakeAit = new UpdateAitDto(fakeAits[0]);

      const response = await service.update('1', createFakeAit);

      expect(response).toEqual(fakeAits[0]);
      expect(prisma.ait.update).toHaveBeenCalledTimes(1);
      expect(prisma.ait.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: fakeAits[0],
      });
    });

    it(`should return NotFoundException when no ait is found`, async () => {
      const unexistingAit = new UpdateAitDto({
        id: '42',
        nome: 'não utilizar cinto de segurança',
        data: new Date(Date.now()),
        nome_do_agente: 'Marco Aurelio',
        nome_do_condutor: 'João da Silva',
        status: 'CANCELADA',
      });

      jest.spyOn(prisma.ait, 'update').mockRejectedValue(new Error());

      try {
        await service.update('42', unexistingAit);
      } catch (error) {
        expect(error).toEqual(new NotFoundException());
      }

      expect(prisma.ait.update).toHaveBeenCalledWith({
        where: { id: '42' },
        data: unexistingAit,
      });
    });
  });

  describe('deleteOne', () => {
    it(`should delete ait and return empty body`, async () => {
      expect(await service.remove('1')).toBeUndefined();
      expect(prisma.ait.delete).toHaveBeenCalledTimes(1);
      expect(prisma.ait.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it(`should return NotFoundException if ait does not exist`, async () => {
      jest.spyOn(prisma.ait, 'delete').mockRejectedValue(new Error());

      try {
        await service.remove('99');
      } catch (error) {
        expect(error).toEqual(new NotFoundException());
      }

      expect(prisma.ait.delete).toHaveBeenCalledTimes(1);
      expect(prisma.ait.delete).toHaveBeenCalledWith({
        where: { id: '99' },
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
