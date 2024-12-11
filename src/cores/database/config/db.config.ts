import "reflect-metadata";
import { SeederOptions } from 'typeorm-extension';
import { User } from "../../../modules/users/entities/user.entity";
import config from "../../../common/configs/env.config";
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.config" });

// Lấy thông tin từ file config
const { HOST, PORT, USERNAME, DATABASE, PASSWORD } = config.postgres;
  console.log(PASSWORD,'PASSWORD')
// Khởi tạo DataSource
export const AppDataSource = new DataSource({
  type: "postgres",
  host: HOST,
  port: Number(PORT),
  username:USERNAME,
  password: PASSWORD,
  database: DATABASE,
  synchronize: true,
  logging: true,
  entities: [User],
  migrations: ["../migrations/*.ts"],
});

