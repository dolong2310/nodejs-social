import { DatabaseInstance, startIntegrationHttpServer } from '../helpers/integration-app';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'node:http';

const isoDob = '2000-01-01T00:00:00.000Z';
const password = 'Smoke-test-1';

describe('integration smoke (auth + friends + chat HTTP)', () => {
  let baseUrl: string;
  let httpServer: Server;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const ctx = await startIntegrationHttpServer();
    baseUrl = ctx.baseUrl;
    httpServer = ctx.httpServer;
    close = ctx.close;
  });

  afterAll(async () => {
    await close();
  });

  it('register → verify-email → Bearer me; friends; direct chat messages', async () => {
    const t = Date.now();
    const emailA = `smoke-a-${t}@test.local`;
    const emailB = `smoke-b-${t}@test.local`;

    const agent = request.agent(httpServer);

    const regBody = (email: string) => ({
      name: `Smoke ${email}`,
      email,
      password,
      confirmPassword: password,
      dateOfBirth: isoDob
    });

    const regA = await agent.post('/api/auth/register').send(regBody(emailA)).expect(201);
    const regB = await agent.post('/api/auth/register').send(regBody(emailB)).expect(201);

    const idA = (regA.body as { data: { _id: string } }).data._id;
    const idB = (regB.body as { data: { _id: string } }).data._id;

    const users = DatabaseInstance.get().users;

    const userDocA = await users.findOne({ email: emailA }, { projection: { emailVerificationToken: 1 } });
    const userDocB = await users.findOne({ email: emailB }, { projection: { emailVerificationToken: 1 } });
    expect(userDocA?.emailVerificationToken).toBeTruthy();
    expect(userDocB?.emailVerificationToken).toBeTruthy();

    await agent.post('/api/auth/verify-email').send({ token: userDocA!.emailVerificationToken }).expect(200);
    await agent.post('/api/auth/verify-email').send({ token: userDocB!.emailVerificationToken }).expect(200);

    const loginA = await agent.post('/api/auth/login').send({ email: emailA, password }).expect(200);
    const loginB = await agent.post('/api/auth/login').send({ email: emailB, password }).expect(200);

    const accessA = (loginA.body as { data: { accessToken: string } }).data.accessToken;
    const accessB = (loginB.body as { data: { accessToken: string } }).data.accessToken;

    await agent.get('/api/users/me').set('Authorization', `Bearer ${accessA}`).expect(200);

    await agent
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ toUserId: idB })
      .expect(201);

    await agent.post(`/api/friends/requests/${idA}/accept`).set('Authorization', `Bearer ${accessB}`).expect(200);

    const directRes = await agent
      .post('/api/conversations/direct')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ peerUserId: idB })
      .expect(201);

    const conversationId = (directRes.body as { data: { id: string } }).data.id;

    await agent
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessA}`)
      .send({ text: 'smoke hello' })
      .expect(201);

    const listRes = await agent
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${accessA}`)
      .expect(200);

    const messages = (listRes.body as { data: { messages: { text?: string }[] } }).data.messages;
    expect(messages.some((m) => m.text === 'smoke hello')).toBe(true);
    expect(accessB.length).toBeGreaterThan(10);
    expect(baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });
});
