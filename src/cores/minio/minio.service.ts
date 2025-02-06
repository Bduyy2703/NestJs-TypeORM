import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: '127.0.0.1',
      port: 9000,
      useSSL: false,
      accessKey: 'admin', // MINIO_ROOT_USER lCifeGDKAgw1hxrjIfJM
      secretKey: 'password123', // MINIO_ROOT_PASSWORD 4ssqZvLRLg3zDSGLglJmmq4m5ieyLmf9eHPnMlnN
    });
  }

  async uploadFileFromBuffer(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    await this.minioClient.putObject(
      bucketName,
      objectName,
      buffer,
      buffer.length, // Độ dài của buffer
      { 'Content-Type': mimeType }, // Metadata của file
    );
  }

  async downloadFile(bucketName: string, objectName: string) {
    return this.minioClient.getObject(bucketName, objectName);
  }


  async listFiles(bucketName: string): Promise<string[]> {
    const files: string[] = [];

    const stream = this.minioClient.listObjectsV2(bucketName, '', true);

    return new Promise((resolve, reject) => {
      stream.on('data', obj => files.push(obj.name));
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
  }

  async deleteFile(bucketName: string, objectName: string) {
    await this.minioClient.removeObject(bucketName, objectName);
  }

  async getUrlByName(bucketName: string, objectNames: string[]): Promise<string[]> {
    const urls: string[] = [];

    if (bucketName === 'public') {
      for (const objectName of objectNames) {
        let fileExists = await this.checkFileExists(bucketName, objectName);
        if (fileExists) {
          const url = `http://localhost:9000/${bucketName}/${objectName}`;
          urls.push(url);
        } else {
          console.warn(`File không tồn tại: ${objectName}`);
        }
      }
      return urls;
    }
    else {
      for (const objectName of objectNames) {
        let fileExists = await this.checkFileExists(bucketName, objectName);
        if (fileExists) {
          const url = await this.minioClient.presignedGetObject(bucketName, objectName);
          urls.push(url);
        }
        else {
          console.warn(`File không tồn tại: ${objectName}`);
        }
        
      }
      return urls;
    }
  }

  private async checkFileExists(bucketName: string, objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucketName, objectName);
      return true;
    } catch (error) {
      console.log(`Lỗi kiểm tra file ${objectName}:`, error);
      return false;
    }
  }
}
