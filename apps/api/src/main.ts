import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService<AppConfig, true>);

  const uploadDir = configService.get('upload', { infer: true }).dir;
  const backupDir = configService.get('backup', { infer: true }).dir;
  for (const dir of [uploadDir, backupDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  app.use(
    helmet({
      contentSecurityPolicy: false, // the SPA frontend sets its own CSP; the API only serves JSON/files
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(configService.get('cookie', { infer: true }).secret));
  // Publicly readable static assets (company logo, etc). Sensitive attachments are
  // served exclusively through the permission-checked /attachments/:id/download route.
  app.use('/uploads', express.static(uploadDir));

  app.enableCors({
    origin: configService.get('corsOrigins', { infer: true }),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LOS Version Management Portal API')
    .setDescription('REST API for tracking LOS releases across Development, QA, UAT and Production environments.')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`LOS Version Portal API listening on http://localhost:${port}/api (docs at /api/docs)`);
}

bootstrap();
