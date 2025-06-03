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
      headers: {
        'Content-Type': 'application/json', // Đảm bảo Content-Type chuẩn
      },
    });
  }

  async onModuleInit() {
    let retries = 10;
    while (retries > 0) {
      try {
        const pingResult = await this.client.info(); // Thay ping bằng info để lấy thêm thông tin
        console.log('Kết nối thành công với Elasticsearch:', pingResult);
        break;
      } catch (error) {
        retries--;
        console.error(`Lỗi kết nối Elasticsearch, thử lại (${retries} lần còn lại):`, error);
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
          } as any,
        });
        console.log('Đã tạo index products');
      } else {
        console.log('Index products đã tồn tại');
      }
    } catch (error) {
      console.error('Lỗi khi tạo index products:', error);
      throw new Error('Không thể tạo index products');
    }
  }

  getClient() {
    return this.client;
  }
}