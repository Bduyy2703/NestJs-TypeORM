import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from './common/configs/swagger.config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api-docs/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Config Swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs/v1', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
