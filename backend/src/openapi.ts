/**
 * Shared OpenAPI document config — used by both the live Swagger UI (main.ts) and the
 * `contract:export` script, so /docs and contract/openapi.yaml stay identical. — arch §5, CLAUDE §8
 */
import { DocumentBuilder } from '@nestjs/swagger';

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Redwave ERP / HRM API')
    .setDescription(
      'Versioned REST contract for the Redwave platform. Each protected endpoint notes the ' +
        'required (module, action) permission enforced server-side by the RBAC guard.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
}
