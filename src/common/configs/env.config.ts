import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const dev = {
  app: {
    port:  3055,
  },
  postgres: {
    HOST: 'localhost',
    PORT: 5432,
    USERNAME:  'postgres',
    PASSWORD:  '27102003',
    DATABASE: 'jewelry',
  },
};

const pro = {
  app: {
    port: process.env.PRO_APP_PORT || 3055,
  },
  postgres: {
    HOST: process.env.PRO_DB_HOST || 'localhost',
    PORT: process.env.PRO_DB_PORT || 5432,
    USERNAME: process.env.PRO_DB_USERNAME || 'bale',
    PASSWORD: process.env.PRO_DB_PASSWORD || '',
    DATABASE: process.env.PRO_DB_DATABASE || 'todo',
  },
};

const config = { dev, pro };

const env = process.env.NODE_ENV || 'dev';

export default config[env];
