import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

beforeAll(async () => {
  // Conecta ao banco de dados
  await prisma.$connect();
});

afterAll(async () => {
  // Desconecta do banco de dados
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpa os dados da tabela antes de cada teste
  await prisma.ait.deleteMany();
});

describe('Testes de banco de dados CRUD com Prisma', () => {
  it('deve inserir, ler, atualizar e deletar um item', async () => {
    // Inserir um dado (Create)

    const now = new Date(Date.now());

    const item = await prisma.ait.create({
      data: {
        nome: 'Teste 1',
        nome_do_agente: 'Agente de Teste',
        nome_do_condutor: 'Condutor de Test',
        data: now,
        status: 'Em Teste',
      },
    });

    expect(item).toBeTruthy();
    expect(item.nome).toBe('Teste 1');
    expect(item.nome_do_agente).toBe('Agente de Teste');
    expect(item.nome_do_condutor).toBe('Condutor de Teste');
    expect(item.data).toBe(now);
    expect(item.status).toBe('Em Teste');

    // Ler o dado (Read)
    let foundItem = await prisma.ait.findUnique({
      where: { id: item.id },
    });
    expect(foundItem).toBeTruthy();
    expect(foundItem.nome).toBe('Teste 1');
    expect(foundItem.nome_do_agente).toBe('Agente de Teste');
    expect(foundItem.nome_do_condutor).toBe('Condutor de Teste');
    expect(foundItem.data).toBe(now);
    expect(foundItem.status).toBe('Em Teste');

    // Atualizar o dado (Update)
    foundItem = await prisma.ait.update({
      where: { id: item.id },
      data: { status: 'Testando Update' },
    });
    expect(foundItem.status).toBe('Testando Update');

    // Deletar o dado (Delete)
    await prisma.ait.delete({
      where: { id: item.id },
    });

    const deletedItem = await prisma.ait.findUnique({
      where: { id: item.id },
    });
    expect(deletedItem).toBeNull();
  });
});
