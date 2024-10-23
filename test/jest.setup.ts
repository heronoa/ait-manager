// jest.setup.js
import { config } from 'dotenv';

// Load the correct environment file depending on NODE_ENV
const envFile =
  process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development';
config({ path: envFile });
