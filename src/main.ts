import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://learny0s.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type, Authorization, X-Requested-With, x-api-key',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    })
  );
  //const showStack = process.env.NODE_ENV !== 'production';

  app.useGlobalFilters(new AllExceptionsFilter);

  // 👇 Ahora sí ignorará preflight
  app.use(helmet())
  const port = process.env.PORT;

  // 👇 Render NECESITA este host
  await app.listen(port || 3500, '0.0.0.0');
  console.log(`
  🚀  ==========================================
  ✅  SERVIDOR INICIADO CORRECTAMENTE
  📌  Puerto: ${port}
  🌐  URL: http://localhost:${port}
  📚  Swagger: http://localhost:${port}/api
  🔐  Health Check: http://localhost:${port}/health
  🏓  Ping: http://localhost:${port}/ping
  🔑  X-API-KEY: ${process.env.API_KEY}
  ==========================================
  `);
}

bootstrap();
