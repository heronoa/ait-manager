import { SQSClient } from '@aws-sdk/client-sqs';

export const createSqsClient = (): SQSClient =>
  new SQSClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });
