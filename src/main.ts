import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiKeyGuard } from './common/guards/api-key/api-key.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
  const showStack = process.env.NODE_ENV !== 'production';
  app.enableCors();
  app.useGlobalGuards(new ApiKeyGuard());
  app.useGlobalFilters(new AllExceptionsFilter(showStack));
}
bootstrap();
