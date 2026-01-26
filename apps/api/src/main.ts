import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MarkInflu API')
      .setDescription('API para la plataforma de Influencer Marketing')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y autorización')
      .addTag('users', 'Gestión de usuarios')
      .addTag('creators', 'Perfiles de creadores')
      .addTag('brands', 'Perfiles de marcas')
      .addTag('campaigns', 'Gestión de campañas')
      .addTag('applications', 'Aplicaciones a campañas')
      .addTag('contracts', 'Contratos y milestones')
      .addTag('deliverables', 'Entregables y versiones')
      .addTag('comments', 'Comentarios visuales')
      .addTag('payments', 'Pagos y escrow')
      .addTag('chat', 'Mensajería')
      .addTag('notifications', 'Notificaciones')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`
  🚀 MarkInflu API running on: http://localhost:${port}
  📚 Swagger docs: http://localhost:${port}/api/docs
  🌍 Environment: ${configService.get('NODE_ENV') || 'development'}
  `);
}

bootstrap();
