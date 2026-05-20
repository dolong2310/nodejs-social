import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { installE2eEnv } from './support/e2e-env';

installE2eEnv();

const { createAuthUserE2eApp, EnumOtpType, EnumUserStatus } = await import('./support/auth-user-e2e-app');

const password = 'Password1!';
const changedPassword = 'Changed1!';

describe('authentication and user HTTP e2e', () => {
  it('registers, logs in, reads and updates the current user, and reads the public profile', async () => {
    const fixture = createAuthUserE2eApp();

    await request(fixture.app)
      .post('/api/v1/auth/otp')
      .send({ email: 'user@example.com', type: EnumOtpType.REGISTER })
      .expect(200);

    const registerRes = await request(fixture.app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'user@example.com',
        password,
        confirmPassword: password,
        birthday: '2000-01-01',
        code: fixture.readOtpCode('user@example.com', EnumOtpType.REGISTER)
      })
      .expect(201);

    expect(registerRes.body.data).toMatchObject({ email: 'user@example.com', name: 'Test User' });
    expect(registerRes.body.data).not.toHaveProperty('password');

    const loginRes = await login(fixture, 'user@example.com', password);
    const accessToken = loginRes.body.data.accessToken as string;

    const meRes = await request(fixture.app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meRes.body.data).toMatchObject({ email: 'user@example.com', name: 'Test User' });

    const updateRes = await request(fixture.app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', 'update-me-1')
      .send({ name: 'Updated User', username: 'updated_user', bio: 'Updated bio' })
      .expect(200);

    expect(updateRes.body.data).toMatchObject({
      email: 'user@example.com',
      name: 'Updated User',
      username: 'updated_user',
      bio: 'Updated bio'
    });
    expect(updateRes.body.data).not.toHaveProperty('password');

    const profileRes = await request(fixture.app).get('/api/v1/users/updated_user').expect(200);
    expect(profileRes.body.data).toMatchObject({ email: 'user@example.com', username: 'updated_user' });
  });

  it('refreshes the access token, logs out, and rejects reuse of the revoked refresh token', async () => {
    const fixture = createAuthUserE2eApp();
    await register(fixture, { email: 'refresh@example.com', name: 'Refresh User' });

    const loginRes = await login(fixture, 'refresh@example.com', password);
    const loginCookie = getRefreshCookie(loginRes);

    const refreshRes = await request(fixture.app)
      .get('/api/v1/auth/refresh-token')
      .set('Cookie', loginCookie)
      .expect(200);
    expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));

    const rotatedCookie = getRefreshCookie(refreshRes);
    await request(fixture.app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`)
      .set('Cookie', rotatedCookie)
      .expect(200);

    await request(fixture.app).get('/api/v1/auth/refresh-token').set('Cookie', rotatedCookie).expect(401);
  });

  it('resets password through forgot-password OTP and logs in with the new password', async () => {
    const fixture = createAuthUserE2eApp();
    await register(fixture, { email: 'forgot@example.com', name: 'Forgot User' });

    await request(fixture.app)
      .post('/api/v1/auth/otp')
      .send({ email: 'forgot@example.com', type: EnumOtpType.FORGOT_PASSWORD })
      .expect(200);

    await request(fixture.app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'forgot@example.com',
        password: changedPassword,
        confirmPassword: changedPassword,
        code: fixture.readOtpCode('forgot@example.com', EnumOtpType.FORGOT_PASSWORD)
      })
      .expect(200);

    await request(fixture.app).post('/api/v1/auth/login').send({ email: 'forgot@example.com', password }).expect(401);
    await login(fixture, 'forgot@example.com', changedPassword);
  });

  it('changes password for an authenticated user', async () => {
    const fixture = createAuthUserE2eApp();
    await register(fixture, { email: 'change@example.com', name: 'Change User' });
    const loginRes = await login(fixture, 'change@example.com', password);

    await request(fixture.app)
      .put('/api/v1/users/change-password')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .set('Idempotency-Key', 'change-password-1')
      .send({ password: changedPassword, confirmPassword: changedPassword })
      .expect(200);

    await request(fixture.app).post('/api/v1/auth/login').send({ email: 'change@example.com', password }).expect(401);
    await login(fixture, 'change@example.com', changedPassword);
  });

  it('enables and disables 2FA through authenticated routes', async () => {
    const fixture = createAuthUserE2eApp();
    await register(fixture, { email: '2fa@example.com', name: 'Two Factor User' });
    const loginRes = await login(fixture, '2fa@example.com', password);
    const accessToken = loginRes.body.data.accessToken as string;

    const enableRes = await request(fixture.app)
      .post('/api/v1/auth/2fa/enable')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(enableRes.body.data).toMatchObject({
      secret: 'secret:2fa@example.com',
      uri: 'otpauth://totp/2fa@example.com'
    });

    await request(fixture.app)
      .post('/api/v1/auth/2fa/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totpCode: '123456' })
      .expect(200);
  });

  it('covers admin user CRUD through guarded HTTP routes', async () => {
    const fixture = createAuthUserE2eApp();
    await fixture.seedUser({
      name: 'Admin User',
      email: 'admin@example.com',
      password,
      roleId: fixture.adminRoleId,
      username: 'admin_user'
    });
    const adminLogin = await login(fixture, 'admin@example.com', password);
    const adminToken = adminLogin.body.data.accessToken as string;

    const createRes = await request(fixture.app)
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .set('Idempotency-Key', 'admin-create-user-1')
      .send({
        name: 'Managed User',
        email: 'managed@example.com',
        password,
        confirmPassword: password,
        birthday: '2001-01-01',
        roleId: fixture.userRoleId,
        status: EnumUserStatus.ACTIVE,
        username: 'managed_user'
      })
      .expect(201);

    const userId = createRes.body.data.id as string;
    expect(createRes.body.data).toMatchObject({ email: 'managed@example.com', username: 'managed_user' });
    expect(createRes.body.data).not.toHaveProperty('password');

    const listRes = await request(fixture.app)
      .get('/api/v1/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .expect(200);

    expect(listRes.body.data.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: 'managed@example.com' })])
    );

    const getRes = await request(fixture.app)
      .get(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .expect(200);
    expect(getRes.body.data).toMatchObject({ id: userId, email: 'managed@example.com' });

    const updateRes = await request(fixture.app)
      .put(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .set('Idempotency-Key', 'admin-update-user-1')
      .send({ name: 'Managed User Updated', username: 'managed_updated' })
      .expect(200);
    expect(updateRes.body.data).toMatchObject({
      id: userId,
      name: 'Managed User Updated',
      username: 'managed_updated'
    });

    await request(fixture.app)
      .delete(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .set('Idempotency-Key', 'admin-delete-user-1')
      .expect(200);

    await request(fixture.app)
      .get(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-api-key', fixture.apiKey)
      .expect(404);
  });

  it('rejects protected routes without credentials', async () => {
    const fixture = createAuthUserE2eApp();

    await request(fixture.app).get('/api/v1/users/me').expect(403);
    await request(fixture.app).get('/api/v1/admin/users?page=1&limit=10').expect(403);
  });
});

async function register(
  fixture: ReturnType<typeof createAuthUserE2eApp>,
  data: { email: string; name: string }
): Promise<void> {
  await request(fixture.app)
    .post('/api/v1/auth/otp')
    .send({ email: data.email, type: EnumOtpType.REGISTER })
    .expect(200);
  await request(fixture.app)
    .post('/api/v1/auth/register')
    .send({
      name: data.name,
      email: data.email,
      password,
      confirmPassword: password,
      birthday: '2000-01-01',
      code: fixture.readOtpCode(data.email, EnumOtpType.REGISTER)
    })
    .expect(201);
}

async function login(fixture: ReturnType<typeof createAuthUserE2eApp>, email: string, loginPassword: string) {
  return request(fixture.app).post('/api/v1/auth/login').send({ email, password: loginPassword }).expect(200);
}

function getRefreshCookie(response: request.Response): string {
  const cookie = response.headers['set-cookie'];
  const cookies = Array.isArray(cookie) ? cookie : [cookie];
  const refreshCookie = cookies.find(
    (item): item is string => typeof item === 'string' && item.startsWith('refreshToken=')
  );
  if (!refreshCookie) throw new Error('Expected refreshToken cookie');
  return refreshCookie;
}
