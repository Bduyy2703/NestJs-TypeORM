import { Injectable, Delete } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './file.entity';

@Injectable()
export class FileRepository {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) { }

  async createFile(fileData: Partial<File>): Promise<File> {
    const file = this.fileRepo.create(fileData);
    return await this.fileRepo.save(file);
  }

  async findByFileId(fileId: string): Promise<File | null> {
    return await this.fileRepo.findOne({ where: { fileId } });
  }

  async findAllFiles(): Promise<File[]> {
    return await this.fileRepo.find();
  }

  async Delete(fileId: string): Promise<File | null> {
    const file = await this.fileRepo.findOne({ where: { fileId } });

    if (!file) {
      return null;
    }

    await this.fileRepo.delete(fileId);
    return file;
  }
  async updateFileUrl(fileId: string, fileUrl: string): Promise<void> {
    await this.fileRepo.update(
      { fileId },
      { fileUrl }
    );
  }
  async findFilesByBucketName(bucketName: string) {
    return await this.fileRepo.find({ where: { bucketName } });
  }
  async findFilesByTarget(targetId: number, targetType: string) {
    return this.fileRepo.find({ where: { targetId, targetType } });
  }
}
