import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Cookie parser — required for HttpOnly JWT cookie auth
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — credentials: true required for cookies to be sent cross-origin
  app.enableCors({
    origin: configService.get<string>('frontendUrl'),
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}
bootstrap();
