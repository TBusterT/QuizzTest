import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

export function configureHttp(
  app: NestExpressApplication,
  frontendOrigin: string,
): void {
  // Covers maximum quiz content, including JSON-escaped surrogate pairs.
  app.useBodyParser('json', { limit: '4mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({ origin: frontendOrigin });
}
