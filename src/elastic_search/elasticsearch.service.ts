// src/elasticsearch/elasticsearch.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly client: Client;

  constructor() {
    const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';
    console.log(`Khởi tạo Elasticsearch client với URL: ${elasticsearchUrl}`);
    this.client = new Client({
      node: elasticsearchUrl,
      maxRetries: 10,
      requestTimeout: 60000,
      sniffOnStart: true,
      // Bỏ headers để thư viện tự quản lý
    });
  }

  async onModuleInit() {
    let retries = 10;
    while (retries > 0) {
      try {
        const infoResult = await this.client.info();
        console.log('Kết nối thành công với Elasticsearch:', JSON.stringify(infoResult, null, 2));
        break;
      } catch (error) {
        retries--;
        console.error(`Lỗi kết nối Elasticsearch, thử lại (${retries} lần còn lại):`, JSON.stringify(error, null, 2));
        if (retries === 0) {
          throw new Error('Không thể kết nối tới Elasticsearch sau nhiều lần thử');
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // Chờ 30 giây
      }
    }

    try {
      const indexExists = await this.client.indices.exists({ index: 'products' });
      console.log('Kiểm tra index products:', indexExists);
      if (!indexExists) {
        await this.client.indices.create({
          index: 'products',
          body: {
            mappings: {
              properties: {
                id: { type: 'integer' },
                name: { type: 'text', analyzer: 'standard' },
                originalPrice: { type: 'float' },
                finalPrice: { type: 'float' },
                categoryId: { type: 'integer', null_value: 0 },
                categoryName: { type: 'keyword' },
                totalSold: { type: 'integer' },
                materials: { type: 'keyword' },
                sizes: { type: 'keyword' },
              },
            },
          },
        });
        console.log('Đã tạo index products');
      } else {
        console.log('Index products đã tồn tại');
      }
    } catch (error) {
      console.error('Lỗi khi tạo index products:', JSON.stringify(error, null, 2));
      throw new Error('Không thể tạo index products');
    }
  }

  getClient() {
    return this.client;
  }
}