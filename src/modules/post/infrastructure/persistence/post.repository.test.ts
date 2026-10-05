import { up as upMongoInitIndexes } from '@/infrastructure/persistence/mongodb/migrations/20260518120000-init-indexes';
import { up as upPostgresInitSchema } from '@/infrastructure/persistence/postgres/migrations/20260518120000-init-schema';
import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { MongoUnitOfWork } from '@/modules/core/infrastructure/unit-of-work/mongo.unit-of-work';
import { PostgresUnitOfWork } from '@/modules/core/infrastructure/unit-of-work/postgres.unit-of-work';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.types';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { PostRepository as MongoPostRepository } from '@/modules/post/infrastructure/persistence/mongo/post.impl.repository';
import { PostMapper as MongoPostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { PostRepository as PostgresPostRepository } from '@/modules/post/infrastructure/persistence/postgres/post.impl.repository';
import { PostMapper as PostgresPostMapper } from '@/modules/post/infrastructure/persistence/postgres/post.mapper';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Integration contract for the post view counters: needs real databases (MongoDB as a replica set).
const mongoUri = process.env.POST_TEST_MONGO_URI;
const postgresUri = process.env.POST_TEST_POSTGRES_URI;

type Harness = {
  postRepository: PostRepositoryPort;
  unitOfWork: UnitOfWorkPort;
  userId: string;
  cleanup(): Promise<void>;
};

function runPostViewsContract(label: string, createHarness: () => Promise<Harness>) {
  describe(label, () => {
    let harness: Harness;

    beforeAll(async () => {
      harness = await createHarness();
    });

    afterAll(async () => {
      await harness?.cleanup();
    });

    async function createPostId(): Promise<string> {
      const post = await harness.postRepository.createPost({
        userId: harness.userId,
        type: EnumPostType.POST,
        audience: EnumPostAudience.PUBLIC,
        allowStrangerComments: true,
        content: 'view counter',
        parentId: null,
        hashtags: [],
        mentions: [],
        media: []
      });
      return post.id.toString();
    }

    it('increments user views for a signed-in viewer and guest views otherwise', async () => {
      const { postRepository, userId } = harness;
      const postId = await createPostId();

      const first = await postRepository.increasePostViews({ postId, userId });
      const second = await postRepository.increasePostViews({ postId, userId });
      const guest = await postRepository.increasePostViews({ postId });

      expect(second?.userViews).toBe((first?.userViews ?? 0) + 1);
      expect(second?.guestViews).toBe(first?.guestViews);
      expect(guest?.guestViews).toBe((second?.guestViews ?? 0) + 1);
      expect(guest?.userViews).toBe(second?.userViews);
    });

    it('returns null for a missing post', async () => {
      expect(await harness.postRepository.increasePostViews({ postId: generatePrefixId('post') })).toBeNull();
    });

    it('increments each distinct post once per batch', async () => {
      const { postRepository } = harness;
      const [postA, postB] = [await createPostId(), await createPostId()];
      const before = await postRepository.increasePostViews({ postId: postA });

      const updated = await postRepository.increasePostsViews({
        ids: [postA, postA, postB],
        isAuthenticatedUser: false
      });
      const after = await postRepository.increasePostViews({ postId: postA });

      expect(updated).toBe(2);
      // +1 from the batch (duplicates ignored) and +1 from this read-increment.
      expect(after?.guestViews).toBe((before?.guestViews ?? 0) + 2);
    });

    it('joins an open UnitOfWork transaction', async () => {
      const { postRepository, unitOfWork, userId } = harness;
      const postId = await createPostId();
      const before = await postRepository.increasePostViews({ postId, userId });

      await expect(
        unitOfWork.run(async () => {
          await postRepository.increasePostViews({ postId, userId });
          throw new Error('roll back the view');
        })
      ).rejects.toThrow('roll back the view');
      const after = await postRepository.increasePostViews({ postId, userId });

      expect(after?.userViews).toBe((before?.userViews ?? 0) + 1);
    });
  });
}

if (postgresUri) {
  runPostViewsContract('PostgreSQL post view counters', async () => {
    const schema = `post_contract_${randomUUID().replaceAll('-', '')}`;
    const adminPool = new Pool({ connectionString: postgresUri });
    await adminPool.query(`CREATE SCHEMA ${schema}`);
    const pool = new Pool({ connectionString: postgresUri, options: `-c search_path=${schema}` });
    await upPostgresInitSchema({ context: pool });

    // posts.user_id references users, which reference roles.
    const roleId = generatePrefixId('role');
    const userId = generatePrefixId('user');
    await pool.query(`INSERT INTO roles (id, name, is_active) VALUES ($1, 'USER', true)`, [roleId]);
    await pool.query(
      `INSERT INTO users (id, name, email, password, birthday, role_id, status)
       VALUES ($1, 'Post test', $2, 'hash', '1995-01-01', $3, 'ACTIVE')`,
      [userId, `${userId}@example.com`, roleId]
    );

    return {
      postRepository: new PostgresPostRepository(pool, new PostgresPostMapper(), {} as never),
      unitOfWork: new PostgresUnitOfWork(pool),
      userId,
      cleanup: async () => {
        await pool.end();
        await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);
        await adminPool.end();
      }
    };
  });
} else {
  describe.skip('PostgreSQL post view counters (set POST_TEST_POSTGRES_URI to run integration contract)', () => {});
}

if (mongoUri) {
  runPostViewsContract('Mongo post view counters', async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(`post_contract_${randomUUID().replaceAll('-', '')}`);
    await upMongoInitIndexes({ context: db });

    return {
      postRepository: new MongoPostRepository(db, client, new MongoPostMapper(), {} as never),
      unitOfWork: new MongoUnitOfWork(client),
      userId: generatePrefixId('user'),
      cleanup: async () => {
        await db.dropDatabase();
        await client.close();
      }
    };
  });
} else {
  describe.skip('Mongo post view counters (set POST_TEST_MONGO_URI to run integration contract)', () => {});
}
