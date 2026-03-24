/**
 * UAT Phase 5 (auto): tests 2–7 — list, cursor/unreadOnly, mark read, NOTF-02 contract,
 * socket notification:new (NOTF-03), block filter on list (D-14).
 *
 * Run: npx tsx scripts/uat-notifications-smoke.ts --env=development
 * Optional: UAT_SMOKE_EMAIL + UAT_SMOKE_PASSWORD (recipient = existing user; sender still temp).
 */
import { io } from 'socket.io-client';
import { MongoClient, ObjectId } from 'mongodb';
import { envConfig } from '../src/config/index.js';
import { NOTIFICATION_SOCKET_EVENT } from '../src/constants/notification.constant.js';
import { ETokenType } from '../src/enums/token.enum.js';
import type { INotificationPayload, NotificationType } from '../src/models/schemas/notification.schema.js';
import NotificationSchema from '../src/models/schemas/notification.schema.js';
import BlockSchema from '../src/models/schemas/block.schema.js';
import TokenService from '../src/services/token.service.js';

const baseUrl = `http://127.0.0.1:${parseInt(envConfig.PORT, 10)}`;

type NotifItem = {
  _id: string;
  type: string;
  read: boolean;
  createdAt: string;
  summary: string;
  actor: { userId: string; displayName: string; avatar?: string };
  payload: Record<string, unknown>;
};

type ListBody = {
  data?: {
    notifications: NotifItem[];
    nextCursor: string | null;
  };
};

function decodeUserIdFromAccessToken(token: string): string {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('invalid JWT');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { userId?: string };
  if (!payload.userId) throw new Error('JWT missing userId');
  return payload.userId;
}

function assertListShape(data: ListBody['data'], minLen?: number) {
  if (!data || !Array.isArray(data.notifications)) throw new Error('missing data.notifications');
  if (!('nextCursor' in data)) throw new Error('missing nextCursor');
  if (minLen !== undefined && data.notifications.length < minLen) {
    throw new Error(`expected at least ${minLen} items, got ${data.notifications.length}`);
  }
  const types = new Set(['friend_request', 'friend_accepted', 'new_message', 'added_to_group']);
  for (const n of data.notifications) {
    if (!types.has(n.type)) throw new Error(`invalid type: ${n.type}`);
    if (typeof n.read !== 'boolean') throw new Error('read must be boolean');
    if (!n.createdAt) throw new Error('missing createdAt');
    if (!n.actor?.displayName) throw new Error('missing actor.displayName');
    if (typeof n.summary !== 'string' || n.summary.length === 0) throw new Error('missing summary');
  }
  for (let i = 1; i < data.notifications.length; i++) {
    const prev = new Date(data.notifications[i - 1].createdAt).getTime();
    const cur = new Date(data.notifications[i].createdAt).getTime();
    if (cur > prev) throw new Error('expected createdAt descending (newest first)');
  }
}

function readStateById(data: ListBody['data'], idHex: string): boolean | undefined {
  return data?.notifications.find((n) => n._id === idHex)?.read;
}

async function fetchList(accessToken: string, qs: string): Promise<{ status: number; body: ListBody }> {
  const res = await fetch(`${baseUrl}/api/notifications${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const body = (await res.json()) as ListBody;
  return { status: res.status, body };
}

async function patchJson(accessToken: string, path: string, body: unknown): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${baseUrl}/api/notifications${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body ?? {})
  });
  return { status: res.status, json: await res.json() };
}

function assertNotifPayloadContract(n: NotifItem) {
  const p = n.payload;
  switch (n.type) {
    case 'friend_request':
      if (typeof p.fromUserId !== 'string') throw new Error('friend_request payload.fromUserId');
      break;
    case 'friend_accepted':
      if (typeof p.friendUserId !== 'string') throw new Error('friend_accepted payload.friendUserId');
      break;
    case 'new_message':
      if (typeof p.chatId !== 'string' || typeof p.messageId !== 'string') throw new Error('new_message ids');
      if (p.previewKind !== 'text' && p.previewKind !== 'attachment' && p.previewKind !== 'mixed') {
        throw new Error('new_message previewKind');
      }
      break;
    case 'added_to_group':
      if (typeof p.chatId !== 'string') throw new Error('added_to_group chatId');
      break;
    default:
      throw new Error(`unknown type ${n.type}`);
  }
}

async function waitForSocketNotification(accessToken: string, timeoutMs: number): Promise<{ socketPayload: unknown }> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { Authorization: `Bearer ${accessToken}` },
      transports: ['websocket'],
      extraHeaders: { Origin: envConfig.FRONTEND_URL },
      reconnection: false,
      timeout: 10000
    });
    const t = setTimeout(() => {
      socket.removeAllListeners();
      socket.close();
      reject(new Error('notification:new timeout'));
    }, timeoutMs);
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      socket.close();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
    socket.on(NOTIFICATION_SOCKET_EVENT, (data: unknown) => {
      clearTimeout(t);
      socket.removeAllListeners();
      socket.close();
      resolve({ socketPayload: data });
    });
  });
}

async function main() {
  const mongo = new MongoClient(envConfig.DATABASE_URI);
  await mongo.connect();
  const db = mongo.db(envConfig.DATABASE_NAME);
  const users = db.collection('users');
  const notifications = db.collection('notifications');
  const blocks = db.collection('blocks');
  const friendRequests = db.collection('friendRequests');

  const idsToDelete: ObjectId[] = [];
  let recipientId: ObjectId;
  let accessToken: string;
  let deleteRecipient = false;
  let senderId: ObjectId | null = null;
  let senderToken: string | null;
  let blockPeerId: ObjectId | null = null;

  const existingEmail = process.env.UAT_SMOKE_EMAIL?.trim();
  const existingPassword = process.env.UAT_SMOKE_PASSWORD;

  if (existingEmail && existingPassword) {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: existingEmail, password: existingPassword })
    });
    const loginJson = (await loginRes.json()) as { data?: { accessToken: string } };
    if (!loginRes.ok) throw new Error(`login ${loginRes.status}: ${JSON.stringify(loginJson)}`);
    accessToken = loginJson.data!.accessToken;
    recipientId = new ObjectId(decodeUserIdFromAccessToken(accessToken));
    await users.updateOne(
      { _id: recipientId },
      { $set: { verificationStatus: 'verified', emailVerificationToken: '' } }
    );
  } else {
    recipientId = new ObjectId();
    deleteRecipient = true;
    const email = `uat-smoke-${Date.now()}@example.com`;
    const now = new Date();
    await users.insertOne({
      _id: recipientId,
      name: 'UAT Smoke',
      email,
      password: 'not-used',
      dateOfBirth: new Date('1990-01-01'),
      verificationStatus: 'verified',
      emailVerificationToken: '',
      forgotPasswordToken: '',
      bio: '',
      location: '',
      website: '',
      username: `uat-smoke-${recipientId.toHexString().slice(0, 8)}`,
      avatar: '',
      coverPhoto: '',
      createdAt: now,
      updatedAt: now
    });
    const tokenService = new TokenService();
    accessToken = tokenService.signAccessTokenSync({
      userId: recipientId.toHexString(),
      type: ETokenType.ACCESS_TOKEN
    });
  }

  try {
    let { status, body: listJson } = await fetchList(accessToken, '');
    if (status !== 200) throw new Error(`GET notifications ${status}`);
    assertListShape(listJson.data);
    const initialLen = listJson.data!.notifications.length;

    const t0 = new Date('2026-01-15T10:00:00.000Z').getTime();
    const actorUserId = new ObjectId().toHexString();
    const peerId = new ObjectId().toHexString();
    const chatId = new ObjectId().toHexString();
    const messageId = new ObjectId().toHexString();

    const types: NotificationType[] = [
      'friend_request',
      'friend_accepted',
      'new_message',
      'added_to_group',
      'friend_request',
      'new_message'
    ];

    const docs = types.map((type, i) => {
      const createdAt = new Date(t0 + i * 1000);
      const read = i < 3;
      let payload: INotificationPayload;
      switch (type) {
        case 'friend_request':
          payload = { fromUserId: peerId };
          break;
        case 'friend_accepted':
          payload = { friendUserId: peerId };
          break;
        case 'new_message':
          payload = { chatId, messageId, previewKind: 'text', previewText: `m${i}` };
          break;
        case 'added_to_group':
          payload = { chatId, chatName: 'UAT Group' };
          break;
        default:
          throw new Error('unreachable');
      }
      return new NotificationSchema({
        recipientId,
        read,
        createdAt,
        type,
        actor: { userId: actorUserId, displayName: 'Seed Actor' },
        payload
      });
    });

    for (const d of docs) idsToDelete.push(d._id);
    await notifications.insertMany(docs);

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=50'));
    if (status !== 200) throw new Error(`GET for test5 ${status}`);
    assertListShape(listJson.data);
    const seededSet = new Set(docs.map((d) => d._id.toHexString()));
    const seededRows = listJson.data!.notifications.filter((n) => seededSet.has(n._id));
    if (seededRows.length !== 6) throw new Error('test5: expected 6 seeded rows in list');
    const typeSet = new Set(seededRows.map((r) => r.type));
    for (const t of ['friend_request', 'friend_accepted', 'new_message', 'added_to_group'] as const) {
      if (!typeSet.has(t)) throw new Error(`test5: missing type ${t}`);
    }
    for (const n of seededRows) assertNotifPayloadContract(n);

    if (listJson.data!.notifications.length < initialLen + 6) {
      throw new Error(`expected at least ${initialLen + 6} notifications after seed`);
    }

    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const qs = cursor ? `?limit=2&cursor=${encodeURIComponent(cursor)}` : '?limit=2';
      ({ status, body: listJson } = await fetchList(accessToken, qs));
      if (status !== 200) throw new Error(`GET notifications paged ${status}`);
      assertListShape(listJson.data);
      for (const n of listJson.data!.notifications) {
        if (seen.has(n._id)) throw new Error(`duplicate id across pages: ${n._id}`);
        seen.add(n._id);
      }
      cursor = listJson.data!.nextCursor;
      pages += 1;
      if (pages > 20) throw new Error('pagination runaway');
    } while (cursor !== null);

    for (const id of idsToDelete.slice(0, 6)) {
      if (!seen.has(id.toHexString())) throw new Error(`seed id missing from paged results: ${id}`);
    }

    const seededUnreadHex = new Set(idsToDelete.slice(3, 6).map((id) => id.toHexString()));
    const unreadAllIds: string[] = [];
    cursor = null;
    do {
      const qs = cursor
        ? `?unreadOnly=true&limit=20&cursor=${encodeURIComponent(cursor)}`
        : '?unreadOnly=true&limit=20';
      ({ status, body: listJson } = await fetchList(accessToken, qs));
      if (status !== 200) throw new Error(`GET unreadOnly ${status}`);
      assertListShape(listJson.data);
      for (const n of listJson.data!.notifications) {
        if (n.read !== false) throw new Error('unreadOnly row must have read:false');
        unreadAllIds.push(n._id);
      }
      cursor = listJson.data!.nextCursor;
    } while (cursor !== null);

    for (const h of seededUnreadHex) {
      if (!unreadAllIds.includes(h)) throw new Error(`seeded unread ${h} not found across unread pages`);
    }

    ({ status, body: listJson } = await fetchList(accessToken, '?unreadOnly=1&limit=2'));
    if (status !== 200) throw new Error(`GET unreadOnly limit=2 ${status}`);
    assertListShape(listJson.data);
    for (const n of listJson.data!.notifications) {
      if (n.read !== false) throw new Error('unreadOnly limit=2: read must be false');
    }
    if (listJson.data!.nextCursor) {
      const qs2 = `?unreadOnly=true&limit=2&cursor=${encodeURIComponent(listJson.data!.nextCursor)}`;
      ({ status, body: listJson } = await fetchList(accessToken, qs2));
      if (status !== 200) throw new Error(`GET unread page2 ${status}`);
      assertListShape(listJson.data);
      for (const n of listJson.data!.notifications) {
        if (n.read !== false) throw new Error('unread page2: read must be false');
      }
    }

    const idSingle = idsToDelete[5].toHexString();
    const idBatchA = idsToDelete[3].toHexString();
    const idBatchB = idsToDelete[4].toHexString();

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=50'));
    if (status !== 200) throw new Error(`GET before mark-one ${status}`);
    assertListShape(listJson.data);
    if (readStateById(listJson.data, idSingle) !== false) throw new Error('expected idSingle unread before PATCH');

    let pr = await patchJson(accessToken, `/${idSingle}/read`, {});
    if (pr.status !== 200) throw new Error(`PATCH one read ${pr.status}: ${JSON.stringify(pr.json)}`);

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=50'));
    if (status !== 200) throw new Error(`GET after mark-one ${status}`);
    assertListShape(listJson.data);
    if (readStateById(listJson.data, idSingle) !== true) throw new Error('expected idSingle read after PATCH');

    pr = await patchJson(accessToken, '/read', { ids: [idBatchA, idBatchB] });
    if (pr.status !== 200) throw new Error(`PATCH read ids ${pr.status}: ${JSON.stringify(pr.json)}`);

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=50'));
    if (status !== 200) throw new Error(`GET after batch read ${status}`);
    assertListShape(listJson.data);
    for (const id of idsToDelete.slice(0, 6)) {
      if (readStateById(listJson.data, id.toHexString()) !== true) {
        throw new Error(`expected all six seeds read, failed at ${id}`);
      }
    }

    const extraUnread: NotificationSchema[] = [
      new NotificationSchema({
        recipientId,
        read: false,
        createdAt: new Date(t0 + 100 * 1000),
        type: 'friend_request',
        actor: { userId: actorUserId, displayName: 'Extra A' },
        payload: { fromUserId: peerId }
      }),
      new NotificationSchema({
        recipientId,
        read: false,
        createdAt: new Date(t0 + 101 * 1000),
        type: 'friend_request',
        actor: { userId: actorUserId, displayName: 'Extra B' },
        payload: { fromUserId: peerId }
      })
    ];
    for (const d of extraUnread) idsToDelete.push(d._id);
    await notifications.insertMany(extraUnread);

    pr = await patchJson(accessToken, '/read', {});
    if (pr.status !== 200) throw new Error(`PATCH read mark-all ${pr.status}: ${JSON.stringify(pr.json)}`);

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=50'));
    if (status !== 200) throw new Error(`GET after mark-all ${status}`);
    assertListShape(listJson.data);
    const extraA = extraUnread[0]._id.toHexString();
    const extraB = extraUnread[1]._id.toHexString();
    if (readStateById(listJson.data, extraA) !== true || readStateById(listJson.data, extraB) !== true) {
      throw new Error('expected extras read after mark-all');
    }

    // --- Test 6: socket notification:new after friend request (NOTF-03) ---
    senderId = new ObjectId();
    const senderEmail = `uat-sender-${Date.now()}@example.com`;
    const nowS = new Date();
    await users.insertOne({
      _id: senderId,
      name: 'UAT Sender',
      email: senderEmail,
      password: 'not-used',
      dateOfBirth: new Date('1990-01-01'),
      verificationStatus: 'verified',
      emailVerificationToken: '',
      forgotPasswordToken: '',
      bio: '',
      location: '',
      website: '',
      username: `uat-snd-${senderId.toHexString().slice(0, 8)}`,
      avatar: '',
      coverPhoto: '',
      createdAt: nowS,
      updatedAt: nowS
    });
    const tokenService = new TokenService();
    senderToken = tokenService.signAccessTokenSync({
      userId: senderId.toHexString(),
      type: ETokenType.ACCESS_TOKEN
    });

    const socketWait = waitForSocketNotification(accessToken, 12000);
    await new Promise((r) => setTimeout(r, 300));

    const fr = await fetch(`${baseUrl}/api/friends/requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${senderToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toUserId: recipientId.toHexString() })
    });
    const frJson = await fr.json();
    if (fr.status !== 201) throw new Error(`send friend request ${fr.status}: ${JSON.stringify(frJson)}`);

    const { socketPayload } = await socketWait;
    const sock = socketPayload as { notification?: NotifItem };
    if (!sock?.notification || sock.notification.type !== 'friend_request') {
      throw new Error(`test6: expected notification:new friend_request, got ${JSON.stringify(socketPayload)}`);
    }
    if (sock.notification._id) {
      idsToDelete.push(new ObjectId(sock.notification._id));
    }

    // --- Test 7: D-14 list hides actor in block set ---
    blockPeerId = new ObjectId();
    const hiddenDoc = new NotificationSchema({
      recipientId,
      read: true,
      createdAt: new Date(t0 + 200 * 1000),
      type: 'friend_request',
      actor: { userId: blockPeerId.toHexString(), displayName: 'Blocked Actor' },
      payload: { fromUserId: peerId }
    });
    idsToDelete.push(hiddenDoc._id);
    await notifications.insertOne(hiddenDoc);
    const blockDoc = new BlockSchema({ blockerId: recipientId, blockedId: blockPeerId });
    await blocks.insertOne(blockDoc);

    ({ status, body: listJson } = await fetchList(accessToken, '?limit=100'));
    if (status !== 200) throw new Error(`GET for block test ${status}`);
    assertListShape(listJson.data);
    if (listJson.data!.notifications.some((n) => n._id === hiddenDoc._id.toHexString())) {
      throw new Error('test7: hidden notification should not appear when actor is blocked');
    }

    await blocks.deleteOne({ _id: blockDoc._id });
    ({ status, body: listJson } = await fetchList(accessToken, '?limit=100'));
    if (status !== 200) throw new Error(`GET after unblock ${status}`);
    assertListShape(listJson.data);
    if (!listJson.data!.notifications.some((n) => n._id === hiddenDoc._id.toHexString())) {
      throw new Error('test7: notification should reappear after block removed');
    }

    console.log('OK: tests 2–7 — list, cursor/unreadOnly, mark read, NOTF-02, socket NOTF-03, D-14 block list');
  } finally {
    if (idsToDelete.length > 0) {
      await notifications.deleteMany({ _id: { $in: idsToDelete } });
    }
    if (senderId) {
      await friendRequests.deleteMany({
        $or: [
          { fromUserId: senderId, toUserId: recipientId },
          { fromUserId: recipientId, toUserId: senderId }
        ]
      });
    }
    if (blockPeerId) {
      await blocks.deleteMany({
        $or: [
          { blockerId: recipientId, blockedId: blockPeerId },
          { blockerId: blockPeerId, blockedId: recipientId }
        ]
      });
    }
    if (senderId) {
      await users.deleteOne({ _id: senderId });
    }
    if (deleteRecipient) {
      await users.deleteOne({ _id: recipientId });
    }
    await mongo.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
