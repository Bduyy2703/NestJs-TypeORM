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

  async uploadFile(bucketName: string, objectName: string, filePath: string) {
    return this.minioClient.fPutObject(bucketName, objectName, filePath, {});
  }

  async downloadFile(bucketName: string, objectName: string) {
    return this.minioClient.getObject(bucketName, objectName);
  }


  async listFiles(bucketName: string): Promise<string[]> {
    const objectsList: string[] = [];
    const stream = await this.minioClient.listObjectsV2(bucketName, '', true);
    return new Promise((resolve, reject) => {
      stream.on('data', obj => objectsList.push(obj.name));
      stream.on('error', reject);
      stream.on('end', () => resolve(objectsList));
    });
  }

  async deleteFile(bucketName: string, objectName: string) {
    await this.minioClient.removeObject(bucketName, objectName);
  }
}
