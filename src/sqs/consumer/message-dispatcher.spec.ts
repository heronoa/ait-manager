import { MessageDispatcher } from './message-dispatcher';

describe('MessageDispatcher', () => {
  const handler = { type: 'AIT_CRIADA', handle: jest.fn() };
  let dispatcher: MessageDispatcher;

  beforeEach(() => {
    handler.handle.mockReset();
    handler.handle.mockResolvedValue(undefined);
    dispatcher = new MessageDispatcher([handler]);
  });

  it('chama o handler do tipo com o payload do envelope', async () => {
    await dispatcher.dispatch(
      JSON.stringify({ type: 'AIT_CRIADA', payload: { id: '1' } }),
    );

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(handler.handle).toHaveBeenCalledWith({ id: '1' });
  });

  it('lança erro para JSON inválido sem chamar handler', async () => {
    await expect(dispatcher.dispatch('{não é json')).rejects.toThrow();
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('lança erro quando o envelope não tem type', async () => {
    await expect(
      dispatcher.dispatch(JSON.stringify({ payload: { id: '1' } })),
    ).rejects.toThrow();
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('lança erro quando o envelope não tem payload', async () => {
    await expect(
      dispatcher.dispatch(JSON.stringify({ type: 'AIT_CRIADA' })),
    ).rejects.toThrow();
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('lança erro para tipo sem handler registrado', async () => {
    await expect(
      dispatcher.dispatch(
        JSON.stringify({ type: 'DESCONHECIDO', payload: { id: '1' } }),
      ),
    ).rejects.toThrow();
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('propaga o erro lançado pelo handler', async () => {
    handler.handle.mockRejectedValue(new Error('falhou'));

    await expect(
      dispatcher.dispatch(
        JSON.stringify({ type: 'AIT_CRIADA', payload: { id: '1' } }),
      ),
    ).rejects.toThrow('falhou');
  });
});
