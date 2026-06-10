/**
 * Backend bootstrap.
 *
 * Responsibility: start the NestJS HTTP server with URI versioning (all API routes under /v1),
 * a global validation pipe, CORS for the local frontend, and Swagger UI at /docs. The health
 * endpoint is version-neutral (/health).
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { buildOpenApiConfig } from './openapi';
import { ErrorEnvelopeDto } from './common/errors/error-envelope.dto';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Behind Render/Vercel proxies — trust the first hop so req.ip / secure cookies resolve correctly.
  (app.getHttpAdapter().getInstance() as { set: (k: string, v: unknown) => void }).set('trust proxy', 1);

  // Parse cookies (the httpOnly refresh cookie + the readable CSRF cookie). — arch §security
  app.use(cookieParser());

  // All API routes are served under /v1 (arch §5.1). Health stays version-neutral.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Validate + strip unknown properties on every request body. — arch §11 (validation)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // CORS — arch §11. In production set CORS_ORIGIN to a comma-separated allowlist of frontend origins;
  // those origins are allowed WITH credentials. Unset → permissive (allow all), so local dev is unaffected.
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    });
  } else {
    app.enableCors();
  }

  // Live API docs from the same config the contract export uses.
  const document = SwaggerModule.createDocument(app, buildOpenApiConfig(), {
    extraModels: [ErrorEnvelopeDto], // document the uniform error envelope in components.schemas (arch §5.1)
  });
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(
    `Redwave backend listening on http://localhost:${port} (docs: /docs, health: /health)`,
  );
}

void bootstrap();
