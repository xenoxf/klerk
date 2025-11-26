import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://klerk-front.vercel.app',
        'https://tu-dominio-que-uses.com',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders:
        'Content-Type, Authorization, X-Requested-With, x-api-key',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
  });

  // Mostrar stacktrace solo en desarrollo
  const showStack = process.env.NODE_ENV !== 'production';

  // Registrar filtros y guards ANTES de iniciar el servidor
  app.useGlobalFilters(new AllExceptionsFilter(showStack));
  app.useGlobalGuards(new ApiKeyGuard());

  // Arrancar servidor
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
