import { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.port';
import { GetGoogleAuthUrlInputPort } from '@/modules/authentication/application/use-cases/get-google-auth-url/get-google-auth-url.port';
import { GetGoogleAuthUrlUseCase } from '@/modules/authentication/application/use-cases/get-google-auth-url/get-google-auth-url.usecase';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('GetGoogleAuthUrlUseCase', () => {
  it('encodes request metadata in state and delegates URL generation', () => {
    const googleOAuthService = mockPort<GoogleOAuthServicePort>({
      generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.test/oauth')
    });
    const useCase = new GetGoogleAuthUrlUseCase(googleOAuthService);

    const result = useCase.execute(new GetGoogleAuthUrlInputPort({ ip: '127.0.0.1', userAgent: 'vitest' }));

    const payload = vi.mocked(googleOAuthService.generateAuthUrl).mock.calls[0]?.[0];
    expect(result).toBe('https://accounts.google.test/oauth');
    expect(payload?.scope).toEqual([
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]);
    expect(JSON.parse(Buffer.from(payload?.state ?? '', 'base64').toString('utf8'))).toEqual({
      ip: '127.0.0.1',
      userAgent: 'vitest'
    });
  });
});
