import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000', // Dev local
        'https://learnyosv07.vercel.app', // Tu front en Vercel
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders:
        'Content-Type, Authorization, X-Requested-With, x-api-key',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
  });

  const showStack = process.env.NODE_ENV !== 'production';

  // Filtro global de errores
  app.useGlobalFilters(new AllExceptionsFilter(showStack));

  // Guard global (compatible con OPTIONS)
  app.useGlobalGuards(new ApiKeyGuard());

  // Iniciar servidor
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
