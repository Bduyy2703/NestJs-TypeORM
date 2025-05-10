import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client;
  private readonly minioHost: string;

  // MINIO_ROOT_USER lCifeGDKAgw1hxrjIfJM
  // MINIO_ROOT_PASSWORD 4ssqZvLRLg3zDSGLglJmmq4m5ieyLmf9eHPnMlnN
  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT || 'minio';// '127.0.0.1'
    const port = parseInt(process.env.MINIO_PORT, 10) || 9000;
    const useSSL = process.env.MINIO_USE_SSL === 'false' || false;
    const accessKey = process.env.MINIO_ACCESS_KEY || 'admin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'password123';

    this.minioHost = process.env.MINIO_HOST || endPoint;// '127.0.0.1'
    this.minioClient = new Minio.Client({
      endPoint: endPoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
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
          const url = `https://${this.minioHost}/${bucketName}/${objectName}`;
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
