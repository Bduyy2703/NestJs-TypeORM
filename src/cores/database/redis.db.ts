import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync<CacheModuleOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        isGlobal: true, // Makes cache globally accessible in the app
        store: redisStore,
        // Redis client options
        storeOptions: {
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
        } as RedisClientOptions,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}
