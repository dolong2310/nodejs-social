import { envConfig } from '@/config';
import { SOCKET_CLIENT_CHAT_SUBSCRIBE, SOCKET_SERVER_PRESENCE_CHAT } from '@/constants/socket.constant';
import { DatabaseInstance, startIntegrationHttpServer } from '../helpers/integration-app';
import { io as ioc } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import request from 'supertest';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const isoDob = '2000-01-01T00:00:00.000Z';
const password = 'Smoke-test-1';

async function registerVerifyLogin(
  agent: ReturnType<typeof request.agent>,
  email: string
): Promise<{ userId: string; accessToken: string }> {
  await agent
    .post('/api/auth/register')
    .send({
      name: `Socket ${email}`,
      email,
      password,
      confirmPassword: password,
      dateOfBirth: isoDob
    })
    .expect(201);

  const users = DatabaseInstance.get().users;
  const doc = await users.findOne({ email }, { projection: { emailVerificationToken: 1 } });
  expect(doc?.emailVerificationToken).toBeTruthy();

  await agent.post('/api/auth/verify-email').send({ token: doc!.emailVerificationToken }).expect(200);

  const login = await agent.post('/api/auth/login').send({ email, password }).expect(200);
  const accessToken = (login.body as { data: { accessToken: string } }).data.accessToken;
  const reg = await users.findOne({ email }, { projection: {} });
  const userId = reg!._id.toString();
  return { userId, accessToken };
}

function connectSocket(baseUrl: string, accessToken: string): Socket {
  return ioc(baseUrl, {
    transports: ['websocket'],
    auth: { Authorization: `Bearer ${accessToken}` },
    extraHeaders: {
      Origin: envConfig.FRONTEND_URL
    }
  });
}

describe('socket chat:subscribe + presence:chat', () => {
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

  it('member receives presence:chat after subscribe; non-member does not', async () => {
    const t = Date.now();
    const agent = request.agent(httpServer);

    const { userId: idC, accessToken: tokenC } = await registerVerifyLogin(agent, `sock-c-${t}@test.local`);
    const { userId: idD, accessToken: tokenD } = await registerVerifyLogin(agent, `sock-d-${t}@test.local`);
    const { accessToken: tokenE } = await registerVerifyLogin(agent, `sock-e-${t}@test.local`);

    await agent
      .post('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ toUserId: idD })
      .expect(201);
    await agent.post(`/api/friends/requests/${idC}/accept`).set('Authorization', `Bearer ${tokenD}`).expect(200);

    const directRes = await agent
      .post('/api/chats/direct')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ peerUserId: idD })
      .expect(201);
    const chatId = (directRes.body as { data: { id: string } }).data.id;

    const socketC = connectSocket(baseUrl, tokenC);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('socket C connect timeout'));
      }, 10_000);
      socketC.once('connect_error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
      socketC.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    const presencePromise = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('presence:chat timeout')), 10_000);
      socketC.once(SOCKET_SERVER_PRESENCE_CHAT, (payload: unknown) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });

    socketC.emit(SOCKET_CLIENT_CHAT_SUBSCRIBE, { conversationId: chatId });
    const payload = (await presencePromise) as { conversationId?: string; anyMemberOnline?: boolean };
    expect(payload.conversationId).toBe(chatId);

    socketC.disconnect();

    const socketE = connectSocket(baseUrl, tokenE);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('socket E connect timeout')), 10_000);
      socketE.once('connect_error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
      socketE.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    let sawPresenceForChat = false;
    socketE.on(SOCKET_SERVER_PRESENCE_CHAT, (p: { conversationId?: string }) => {
      if (p?.conversationId === chatId) {
        sawPresenceForChat = true;
      }
    });
    socketE.emit(SOCKET_CLIENT_CHAT_SUBSCRIBE, { conversationId: chatId });
    await new Promise((r) => setTimeout(r, 2000));
    expect(sawPresenceForChat).toBe(false);
    socketE.disconnect();
  });
});
