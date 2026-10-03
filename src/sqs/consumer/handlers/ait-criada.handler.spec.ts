import { PrismaService } from 'src/db/prisma.service';
import { AitCriadaHandler } from './ait-criada.handler';

const prismaMock = {
  ait: {
    findUnique: jest.fn(),
  },
};

describe('AitCriadaHandler', () => {
  let handler: AitCriadaHandler;

  beforeEach(() => {
    prismaMock.ait.findUnique.mockReset();
    handler = new AitCriadaHandler(prismaMock as unknown as PrismaService);
  });

  it('declara o tipo AIT_CRIADA', () => {
    expect(handler.type).toBe('AIT_CRIADA');
  });

  it('resolve quando o AIT existe', async () => {
    prismaMock.ait.findUnique.mockResolvedValue({ id: '1' });

    await expect(handler.handle({ id: '1' })).resolves.toBeUndefined();
    expect(prismaMock.ait.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' } }),
    );
  });

  it('lança erro quando o AIT não existe', async () => {
    prismaMock.ait.findUnique.mockResolvedValue(null);

    await expect(handler.handle({ id: '99' })).rejects.toThrow();
  });

  it('lança erro quando o payload não tem id', async () => {
    await expect(handler.handle({})).rejects.toThrow();
    expect(prismaMock.ait.findUnique).not.toHaveBeenCalled();
  });

  it('lança erro quando o id é string vazia', async () => {
    await expect(handler.handle({ id: '' })).rejects.toThrow();
    expect(prismaMock.ait.findUnique).not.toHaveBeenCalled();
  });
});
