import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://learnyosv07.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, x-api-key',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const showStack = process.env.NODE_ENV !== 'production';

  app.useGlobalFilters(new AllExceptionsFilter(showStack));

  // 👇 Ahora sí ignorará preflight
  app.useGlobalGuards(new ApiKeyGuard());

  // 👇 Render NECESITA este host
  await app.listen(Number(process.env.PORT), '0.0.0.0');
}

bootstrap();
