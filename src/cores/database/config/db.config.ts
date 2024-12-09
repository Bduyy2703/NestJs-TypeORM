import "reflect-metadata";
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { User } from "../../../modules/users/entities/user.entity";
import config from "../../../common/configs/env.config";
import { MainSeeder } from '../seeds/main.seeder';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { HOST, PORT, USERNAME, DATABASE, PASSWORD } = config.postgres;

export const AppDataSource : DataSourceOptions & SeederOptions = {
  type: "postgres",
  host: HOST, 
  port: PORT,
  username: USERNAME,
  password: PASSWORD,
  database: DATABASE, 
  synchronize: true,
  logging: true,
  entities: [User], // Liệt kê tất cả các entity
  migrations: ["../migrations/*.ts"], // Nếu dùng migration
  seeds: [MainSeeder],
};

export default new DataSource(AppDataSource);

