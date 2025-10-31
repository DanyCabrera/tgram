import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // URLs de producción
      'https://tgram-ruby.vercel.app',
      'https://tgram-frontend.vercel.app',
      'https://tgram.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
    validationError: {
      target: false,
      value: false,
    },
  }));

  // Configurar archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Red Social API')
    .setDescription('API para una red social con chat en tiempo real')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación API: http://localhost:${port}/api`);
}
bootstrap();
