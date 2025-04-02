import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from './common/configs/swagger.config';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
const envFilePath = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.development';
dotenv.config({ path: envFilePath })
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true, }));

  // Config Swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
