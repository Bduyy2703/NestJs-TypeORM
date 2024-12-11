import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const dev = {
  app: {
    port: process.env.DEV_APP_PORT || 3055,
  },
  postgres: {
    HOST: process.env.DEV_DB_HOST || 'localhost',
    PORT: process.env.DEV_DB_PORT || 5432,
    USERNAME: process.env.DEV_DB_USERNAME || 'postgres',
    PASSWORD: process.env.DEV_DB_PASSWORD || '',
    DATABASE: process.env.DEV_DB_DATABASE || 'todo',
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
