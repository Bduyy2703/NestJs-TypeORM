import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './db.config';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource)],
  // exports: [TypeOrmModule.forRootAsync(AppDataSource)],
})
export class DatabaseModule {}
