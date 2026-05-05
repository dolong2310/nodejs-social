import { BaseGuard } from '@/presentation/http/express/guards/base.guard';
import { UnauthorizedException } from '@/presentation/http/express/responses/error.response';
import { extractApiKeyFromHeader } from '@/presentation/http/express/utils/token.util';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

export class ApiKeyGuard extends BaseGuard {
  constructor(private readonly apiKey: string) {
    super();
  }

  protected override async canActivate(request: Request): Promise<boolean> {
    const providedApiKey = extractApiKeyFromHeader(request);

    if (typeof providedApiKey !== 'string' || !this.isValidApiKey(providedApiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private isValidApiKey(providedApiKey: string): boolean {
    const expectedHash = this.hashApiKey(this.apiKey);
    const providedHash = this.hashApiKey(providedApiKey);
    return timingSafeEqual(expectedHash, providedHash);
  }

  private hashApiKey(apiKey: string): Buffer {
    return createHash('sha256').update(apiKey).digest();
  }
}
