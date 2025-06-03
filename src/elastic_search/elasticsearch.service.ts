// src/elasticsearch/elasticsearch.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      console.log('Kết nối thành công với Elasticsearch');
    } catch (error) {
      console.error('Lỗi kết nối Elasticsearch:', error);
      throw new Error('Không thể kết nối tới Elasticsearch');
    }

    try {
      const indexExists = await this.client.indices.exists({ index: 'products' });
      if (!indexExists) {
        await this.client.indices.create({
          index: 'products',
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
        });
        console.log('Đã tạo index products');
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