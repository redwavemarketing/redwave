/**
 * @Public() — marks a route as not requiring authentication (login, refresh).
 * JwtAuthGuard skips token verification for routes carrying this metadata.
 */
import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);
