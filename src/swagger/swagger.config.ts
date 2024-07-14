import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('API de Gerenciamento de Auto Infração de Trânsito (AITs)')
  .setDescription(
    'API para gerenciar Auto Infrações de Trânsito (AITs) - usando prisma conectado ao PostgreSQL, Docker, e gerenciamento de filas com SQS',
  )
  .setVersion('0.1')
  .build();
