import { up as upMongoInitIndexes } from '@/infrastructure/persistence/mongodb/migrations/20260518120000-init-indexes';
import { up as upPostgresInitSchema } from '@/infrastructure/persistence/postgres/migrations/20260518120000-init-schema';
import { ConversationMemberMapper as MongoConversationMemberMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member.mapper';
import { ConversationRepository as MongoConversationRepository } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.impl.repository';
import { ConversationMapper as MongoConversationMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.mapper';
import { ConversationMemberMapper as PostgresConversationMemberMapper } from '@/modules/conversation/infrastructure/persistence/postgres/conversation-member.mapper';
import { ConversationRepository as PostgresConversationRepository } from '@/modules/conversation/infrastructure/persistence/postgres/conversation.impl.repository';
import { ConversationMapper as PostgresConversationMapper } from '@/modules/conversation/infrastructure/persistence/postgres/conversation.mapper';
import type { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { MongoUnitOfWork } from '@/modules/core/infrastructure/unit-of-work/mongo.unit-of-work';
import { PostgresUnitOfWork } from '@/modules/core/infrastructure/unit-of-work/postgres.unit-of-work';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import type { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { FriendRequestRepository as MongoFriendRequestRepository } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.impl.repository';
import { FriendRequestMapper as MongoFriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.mapper';
import { FriendshipRepository as MongoFriendshipRepository } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.impl.repository';
import { FriendshipMapper as MongoFriendshipMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.mapper';
import { FriendRequestRepository as PostgresFriendRequestRepository } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.impl.repository';
import { FriendRequestMapper as PostgresFriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.mapper';
import { FriendshipRepository as PostgresFriendshipRepository } from '@/modules/relationship/infrastructure/persistence/postgres/friendship.impl.repository';
import { FriendshipMapper as PostgresFriendshipMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friendship.mapper';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Integration contract: needs real databases. MongoDB must run as a replica set (transactions).
const mongoUri = process.env.UOW_TEST_MONGO_URI;
const postgresUri = process.env.UOW_TEST_POSTGRES_URI;

type Harness = {
  unitOfWork: UnitOfWorkPort;
  friendshipRepository: FriendshipRepositoryPort;
  friendRequestRepository: FriendRequestRepositoryPort;
  conversationRepository: ConversationRepositoryPort;
  createUserIds(count: number): Promise<string[]>;
  cleanup(): Promise<void>;
};

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function runUnitOfWorkContract(label: string, createHarness: () => Promise<Harness>) {
  describe(label, () => {
    let harness: Harness;

    beforeAll(async () => {
      harness = await createHarness();
    });

    afterAll(async () => {
      await harness?.cleanup();
    });

    it('commits writes from several repositories when the work resolves', async () => {
      const { unitOfWork, friendshipRepository, friendRequestRepository } = harness;
      const [a, b, c] = (await harness.createUserIds(3)) as [string, string, string];

      await unitOfWork.run(async () => {
        await friendshipRepository.createFriendship(a, b);
        await friendRequestRepository.createPendingRequest({ fromUserId: a, toUserId: c });
      });

      expect(await friendshipRepository.findFriendshipPair(a, b)).not.toBeNull();
      expect(await friendRequestRepository.findPendingRequestByUserPair({ fromUserId: a, toUserId: c })).not.toBeNull();
    });

    it('rolls back writes from every repository when the work throws', async () => {
      const { unitOfWork, friendshipRepository, friendRequestRepository } = harness;
      const [a, b] = (await harness.createUserIds(2)) as [string, string];
      await friendRequestRepository.createPendingRequest({ fromUserId: a, toUserId: b });

      await expect(
        unitOfWork.run(async () => {
          await friendshipRepository.createFriendship(a, b);
          await friendRequestRepository.deletePendingRequest({ fromUserId: a, toUserId: b });
          throw new Error('fail after both writes');
        })
      ).rejects.toThrow('fail after both writes');

      expect(await friendshipRepository.findFriendshipPair(a, b)).toBeNull();
      expect(await friendRequestRepository.findPendingRequestByUserPair({ fromUserId: a, toUserId: b })).not.toBeNull();
    });

    it('joins the outer transaction when nested', async () => {
      const { unitOfWork, friendshipRepository } = harness;
      const [a, b] = (await harness.createUserIds(2)) as [string, string];

      await expect(
        unitOfWork.run(async () => {
          await unitOfWork.run(async () => {
            await friendshipRepository.createFriendship(a, b);
          });
          throw new Error('fail in the outer work');
        })
      ).rejects.toThrow('fail in the outer work');

      expect(await friendshipRepository.findFriendshipPair(a, b)).toBeNull();
    });

    it('keeps concurrent transactions isolated from each other', async () => {
      const { unitOfWork, friendshipRepository } = harness;
      const [a, b, c, d] = (await harness.createUserIds(4)) as [string, string, string, string];
      const firstWrote = deferred();
      const secondWrote = deferred();

      // Interleave both transactions: each writes while the other one is still open.
      const first = unitOfWork.run(async () => {
        await friendshipRepository.createFriendship(a, b);
        firstWrote.resolve();
        await secondWrote.promise;
      });
      const second = unitOfWork.run(async () => {
        await firstWrote.promise;
        await friendshipRepository.createFriendship(c, d);
        secondWrote.resolve();
        throw new Error('fail only the second transaction');
      });

      await expect(second).rejects.toThrow('fail only the second transaction');
      await first;

      expect(await friendshipRepository.findFriendshipPair(a, b)).not.toBeNull();
      expect(await friendshipRepository.findFriendshipPair(c, d)).toBeNull();
    });

    it('returns null for an existing friendship outside a transaction', async () => {
      const { friendshipRepository } = harness;
      const [a, b] = (await harness.createUserIds(2)) as [string, string];

      expect(await friendshipRepository.createFriendship(a, b)).not.toBeNull();
      expect(await friendshipRepository.createFriendship(b, a)).toBeNull();
    });

    it('returns null for an existing friendship inside a transaction without aborting it', async () => {
      const { unitOfWork, friendshipRepository, friendRequestRepository } = harness;
      const [a, b] = (await harness.createUserIds(2)) as [string, string];
      await friendshipRepository.createFriendship(a, b);
      await friendRequestRepository.createPendingRequest({ fromUserId: a, toUserId: b });

      const created = await unitOfWork.run(async () => {
        const friendship = await friendshipRepository.createFriendship(a, b);
        await friendRequestRepository.deletePendingRequest({ fromUserId: a, toUserId: b });
        return friendship;
      });

      expect(created).toBeNull();
      expect(await friendRequestRepository.findPendingRequestByUserPair({ fromUserId: a, toUserId: b })).toBeNull();
    });

    it('returns null for an existing direct conversation inside a transaction without aborting it', async () => {
      const { unitOfWork, conversationRepository, friendRequestRepository } = harness;
      const [a, b] = (await harness.createUserIds(2)) as [string, string];
      expect(await conversationRepository.createDirectConversation(a, b)).not.toBeNull();

      const created = await unitOfWork.run(async () => {
        const conversation = await conversationRepository.createDirectConversation(b, a);
        await friendRequestRepository.createPendingRequest({ fromUserId: a, toUserId: b });
        return conversation;
      });

      expect(created).toBeNull();
      expect(await friendRequestRepository.findPendingRequestByUserPair({ fromUserId: a, toUserId: b })).not.toBeNull();
    });
  });
}

if (postgresUri) {
  runUnitOfWorkContract('PostgreSQL UnitOfWork', async () => {
    const schema = `uow_contract_${randomUUID().replaceAll('-', '')}`;
    const adminPool = new Pool({ connectionString: postgresUri });
    await adminPool.query(`CREATE SCHEMA ${schema}`);
    const pool = new Pool({ connectionString: postgresUri, options: `-c search_path=${schema}` });
    await upPostgresInitSchema({ context: pool });

    // Relationship tables reference users, which reference roles.
    const roleId = generatePrefixId('role');
    await pool.query(`INSERT INTO roles (id, name, is_active) VALUES ($1, 'USER', true)`, [roleId]);

    return {
      unitOfWork: new PostgresUnitOfWork(pool),
      friendshipRepository: new PostgresFriendshipRepository(pool, new PostgresFriendshipMapper(), {} as never),
      friendRequestRepository: new PostgresFriendRequestRepository(pool, new PostgresFriendRequestMapper(), {} as never),
      conversationRepository: new PostgresConversationRepository(
        pool,
        new PostgresConversationMapper(),
        new PostgresConversationMemberMapper(),
        {} as never
      ),
      createUserIds: async (count) => {
        const ids = Array.from({ length: count }, () => generatePrefixId('user'));
        for (const id of ids) {
          await pool.query(
            `INSERT INTO users (id, name, email, password, birthday, role_id, status)
             VALUES ($1, 'UoW test', $2, 'hash', '1995-01-01', $3, 'ACTIVE')`,
            [id, `${id}@example.com`, roleId]
          );
        }
        return ids;
      },
      cleanup: async () => {
        await pool.end();
        await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);
        await adminPool.end();
      }
    };
  });
} else {
  describe.skip('PostgreSQL UnitOfWork (set UOW_TEST_POSTGRES_URI to run integration contract)', () => {});
}

if (mongoUri) {
  runUnitOfWorkContract('Mongo UnitOfWork', async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(`uow_contract_${randomUUID().replaceAll('-', '')}`);
    await upMongoInitIndexes({ context: db });

    return {
      unitOfWork: new MongoUnitOfWork(client),
      friendshipRepository: new MongoFriendshipRepository(db, client, new MongoFriendshipMapper(), {} as never),
      friendRequestRepository: new MongoFriendRequestRepository(
        db,
        client,
        new MongoFriendRequestMapper(),
        {} as never
      ),
      conversationRepository: new MongoConversationRepository(
        db,
        client,
        new MongoConversationMapper(),
        new MongoConversationMemberMapper(),
        {} as never
      ),
      // No foreign keys in MongoDB, so ids are enough.
      createUserIds: async (count) => Array.from({ length: count }, () => generatePrefixId('user')),
      cleanup: async () => {
        await db.dropDatabase();
        await client.close();
      }
    };
  });
} else {
  describe.skip('Mongo UnitOfWork (set UOW_TEST_MONGO_URI to run integration contract)', () => {});
}
