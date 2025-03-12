import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from 'src/modules/files/file.entity';
import { FileRepository } from 'src/modules/files/file.repository';
@Module({
    imports: [TypeOrmModule.forFeature([File])],
    controllers: [MinioController],
    providers: [MinioService,FileRepository],
    exports: [MinioService]

})
export class MinioModule { }