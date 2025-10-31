import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { webcrypto as nodeWebCrypto, randomUUID as nodeRandomUUID } from 'crypto';

// Polyfill para `global.crypto.randomUUID` en entornos Node 18 donde no está disponible
// Algunas dependencias (ej. @nestjs/typeorm) esperan `crypto.randomUUID()` global
// Render usa Node 18.x; aseguramos compatibilidad definiendo esta API si falta
if (!(global as any).crypto || !(global as any).crypto.randomUUID) {
  (global as any).crypto = {
    ...((global as any).crypto || {}),
    // Preferir WebCrypto si existe, si no, usar la implementación de Node
    randomUUID: (nodeWebCrypto as any)?.randomUUID || nodeRandomUUID,
  } as any;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS
  const allowedOrigins: string[] = [];
  
  // Agregar URL del frontend desde variable de entorno
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  
  // URL de producción (fallback)
  allowedOrigins.push('https://tgram-ruby.vercel.app');
  
  app.enableCors({
    origin: allowedOrigins,
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
