// src/elastic_search/elasticsearch.service.ts
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
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    try {
      // Xóa index cũ để áp dụng mapping mới (chỉ dùng khi test)
      await this.client.indices.delete({ index: 'products', ignore_unavailable: true });
      console.log('Đã xóa index products nếu tồn tại');

      // Tạo index mới
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
              images: { type: 'keyword' }, // Thêm trường images
            },
          },
        },
      });
      console.log('Đã tạo index products');
    } catch (error) {
      console.error('Lỗi khi tạo index products:', JSON.stringify(error, null, 2));
      throw new Error('Không thể tạo index products');
    }
  }

  getClient() {
    return this.client;
  }
}