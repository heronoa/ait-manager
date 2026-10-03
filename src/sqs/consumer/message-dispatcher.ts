import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsDefined, IsObject, IsString, validate } from 'class-validator';

export const MESSAGE_HANDLERS = Symbol('MESSAGE_HANDLERS');

export interface TypedMessageHandler {
  readonly type: string;
  handle(payload: unknown): Promise<void>;
}

class MessageEnvelope {
  @IsString()
  type: string;

  @IsDefined()
  @IsObject()
  payload: object;
}

@Injectable()
export class MessageDispatcher {
  private readonly handlers: Map<string, TypedMessageHandler>;

  constructor(@Inject(MESSAGE_HANDLERS) handlers: TypedMessageHandler[]) {
    this.handlers = new Map(handlers.map((handler) => [handler.type, handler]));
  }

  async dispatch(body: string): Promise<void> {
    const raw = JSON.parse(body);
    const envelope = plainToInstance(MessageEnvelope, raw);

    const errors = await validate(envelope);
    if (errors.length > 0) {
      throw new Error('Envelope de mensagem inválido');
    }

    const handler = this.handlers.get(envelope.type);
    if (!handler) {
      throw new Error(`Nenhum handler registrado para o tipo ${envelope.type}`);
    }

    await handler.handle(envelope.payload);
  }
}
