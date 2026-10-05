import {
  ExpiredTokenException,
  InvalidTokenException
} from '@/modules/authentication/application/exceptions/auth.exception';
import { JwtService } from '@/modules/authentication/infrastructure/services/jwt.service';
import { TokenService } from '@/modules/authentication/infrastructure/services/token.service';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

const config = {
  algorithm: 'HS256',
  accessTokenSecret: 'access-secret',
  refreshTokenSecret: 'refresh-secret',
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d'
} as const;

const tokenService = new TokenService(new JwtService(), config);

describe('TokenService', () => {
  it('signs and verifies access and refresh tokens', async () => {
    const accessToken = await tokenService.signAccessToken({ userId: 'u_1', roleId: 'r_1', roleName: 'USER' });
    const refreshToken = await tokenService.signRefreshToken({ userId: 'u_1' });

    await expect(tokenService.verifyAccessToken(accessToken)).resolves.toMatchObject({
      userId: 'u_1',
      roleId: 'r_1',
      roleName: 'USER'
    });
    await expect(tokenService.verifyRefreshToken(refreshToken)).resolves.toMatchObject({ userId: 'u_1' });
  });

  it('rejects an expired token with ExpiredTokenException', async () => {
    const expired = jwt.sign({ userId: 'u_1', exp: Math.floor(Date.now() / 1000) - 60 }, config.accessTokenSecret);

    await expect(tokenService.verifyAccessToken(expired)).rejects.toBeInstanceOf(ExpiredTokenException);
  });

  it('rejects a token signed with another secret with InvalidTokenException', async () => {
    const refreshToken = await tokenService.signRefreshToken({ userId: 'u_1' });

    await expect(tokenService.verifyAccessToken(refreshToken)).rejects.toBeInstanceOf(InvalidTokenException);
    await expect(tokenService.verifyAccessToken('not-a-jwt')).rejects.toBeInstanceOf(InvalidTokenException);
  });
});
