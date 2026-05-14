/**
 * Seed fake data for Postgres.
 *
 * Run:
 * `pnpm run seed:fake-data:postgres -- --env=development`
 *
 * Prerequisites:
 *  1. Run `pnpm run seed:permissions:postgres -- --env=development` first to ensure roles exist.
 *  2. Set MYID to the entity ID of the existing viewer/admin user in Postgres.
 */
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { PostgresDatabase } from '@/infrastructure/persistence/postgres/database';
import { HashingService } from '@/modules/authentication/infrastructure/services/hashing.service';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/postgres/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/postgres/role.mapper';
import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { HashtagRepository } from '@/modules/post/infrastructure/persistence/postgres/hashtag.impl.repository';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/postgres/hashtag.mapper';
import { PostRepository } from '@/modules/post/infrastructure/persistence/postgres/post.impl.repository';
import { PostMapper } from '@/modules/post/infrastructure/persistence/postgres/post.mapper';
import {
  FriendshipRepository,
  normalizeFriendshipPair
} from '@/modules/relationship/infrastructure/persistence/postgres/friendship.impl.repository';
import { FriendshipMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friendship.mapper';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { UserRepository } from '@/modules/user/infrastructure/persistence/postgres/user.impl.repository';
import { UserMapper } from '@/modules/user/infrastructure/persistence/postgres/user.mapper';
import { faker } from '@faker-js/faker';

const MYID = 'user_019e01ec-9b31-72f0-b97a-391a40d02dc0';
const PASSWORD = '@Bc123';
const USER_COUNT = 10;
const POST_PER_USER = 10;
const HASHTAG_PER_POST = 5;
const MENTION_PER_POST = 5;
const MEDIA_PER_POST = 5;

const postgres = new PostgresDatabase({
  uri: dbConfig.postgres.uri,
  ssl: dbConfig.postgres.ssl
});

const hashingService = new HashingService();
const userRepository = new UserRepository(postgres.pool, new UserMapper(), logger);
const postRepository = new PostRepository(postgres.pool, new PostMapper(), logger);
const friendshipRepository = new FriendshipRepository(postgres.pool, new FriendshipMapper(), logger);
const hashtagRepository = new HashtagRepository(postgres.pool, new HashtagMapper(), logger);
const roleRepository = new RoleRepository(postgres.pool, new RoleMapper(), logger);

interface UserSeedBody {
  name: string;
  email: string;
  password: string;
  birthday: string;
}

const createRandomUserBody = (): UserSeedBody => ({
  name: faker.internet.displayName(),
  email: faker.internet.email(),
  password: PASSWORD,
  birthday: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).toISOString()
});

const createRandomPostData = (userId: string, mentionedUserIds: string[], parentPostIds: string[]) => {
  const typePool =
    parentPostIds.length === 0
      ? [EnumPostType.POST]
      : [EnumPostType.POST, EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE];

  const randomType = faker.helpers.arrayElement(typePool);
  const randomAudience = faker.helpers.arrayElement([
    EnumPostAudience.PUBLIC,
    EnumPostAudience.FRIENDS_ONLY,
    EnumPostAudience.ONLY_ME
  ]);

  const hashtagCount = faker.number.int({ min: 1, max: HASHTAG_PER_POST });
  const toHashtagName = (word: string) => word.replace(/[^a-zA-Z0-9_]/g, '').replace(/^./, (c) => c.toUpperCase());
  const rawHashtagNames = faker.helpers
    .multiple(() => toHashtagName(faker.word.noun()), { count: HASHTAG_PER_POST * 2 })
    .filter((name) => name.length > 0);
  const uniqueHashtagNames = Array.from(new Set(rawHashtagNames)).slice(0, hashtagCount);

  const mentionCount = faker.number.int({ min: 0, max: Math.min(MENTION_PER_POST, mentionedUserIds.length) });
  const rawMentions = faker.helpers.multiple(() => faker.helpers.arrayElement(mentionedUserIds), {
    count: MENTION_PER_POST * 2
  });
  const uniqueMentions = Array.from(new Set(rawMentions)).slice(0, mentionCount);

  const mediaCount = faker.number.int({ min: 1, max: MEDIA_PER_POST });
  const mediaMap = new Map<string, { url: string; type: EnumMediaType }>();
  while (mediaMap.size < mediaCount) {
    const url = faker.image.url();
    if (!mediaMap.has(url)) {
      mediaMap.set(url, { url, type: faker.helpers.arrayElement([EnumMediaType.IMAGE, EnumMediaType.VIDEO]) });
    }
  }
  const randomMedia = Array.from(mediaMap.values()).map((media) => new Media(media));

  const content = faker.lorem.paragraph({ min: 2, max: 5 });
  const parentId = randomType === EnumPostType.POST ? null : faker.helpers.arrayElement(parentPostIds);

  return {
    userId,
    type: randomType,
    audience: randomAudience,
    allowStrangerComments: faker.datatype.boolean({ probability: 0.7 }),
    content,
    parentId,
    hashtagNames: uniqueHashtagNames,
    mentions: uniqueMentions,
    media: randomMedia
  };
};

const insertMultipleUsers = async (userBodies: UserSeedBody[], roleId: string): Promise<string[]> => {
  console.log('Creating users...');
  const userIds: string[] = [];

  for (const body of userBodies) {
    const randomStatus = faker.helpers.arrayElement([
      EnumUserStatus.ACTIVE,
      EnumUserStatus.INACTIVE,
      EnumUserStatus.BANNED
    ]);
    const hashedPassword = await hashingService.hash(body.password);

    const entity = UserEntity.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      birthday: new Date(body.birthday),
      roleId,
      status: randomStatus,
      username: `user-${faker.string.nanoid(10)}`
    });

    const inserted = await userRepository.insert(entity);
    const userId = inserted.id.toString();
    userIds.push(userId);
    console.log(`Created user ${userId}`);
  }

  console.log(`Created ${userIds.length} users`);
  return userIds;
};

const seedFriendshipsForViewer = async (viewerId: string, candidatePeerIds: string[]): Promise<void> => {
  const seen = new Set<string>();
  const peers = candidatePeerIds.filter((peerId) => {
    if (peerId === viewerId) return false;
    if (seen.has(peerId)) return false;
    seen.add(peerId);
    return true;
  });

  console.log(`Seeding ${peers.length} friendship edges for viewer...`);
  let count = 0;

  for (const peerId of peers) {
    try {
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(viewerId, peerId);
      console.log(`Friendship edge ${userIdLow} - ${userIdHigh}`);
      await friendshipRepository.createFriendship(viewerId, peerId);
      count++;
    } catch (err) {
      console.warn(`Skipped friendship ${viewerId} - ${peerId}:`, (err as Error).message);
    }
  }

  console.log(`Inserted ${count} friendship rows`);
};

const insertMultiplePosts = async (userIds: string[]): Promise<void> => {
  console.log('Creating posts...');
  let count = 0;
  const parentPostIds: string[] = [];

  for (const userId of userIds) {
    for (let i = 0; i < POST_PER_USER; i++) {
      const data = createRandomPostData(userId, userIds, parentPostIds);

      const hashtags = await hashtagRepository.insertBulk(data.hashtagNames);
      const hashtagIds = hashtags.map((hashtag) => hashtag.id.toString());

      const post = await postRepository.createPost({
        userId: data.userId,
        type: data.type,
        audience: data.audience,
        allowStrangerComments: data.allowStrangerComments,
        content: data.content,
        parentId: data.parentId,
        hashtags: hashtagIds,
        mentions: data.mentions,
        media: data.media
      });

      if (post.getProps().type === EnumPostType.POST) {
        parentPostIds.push(post.id.toString());
      }

      count++;
      console.log(`Created post ${count} (type: ${data.type})`);
    }
  }

  console.log(`Created ${count} posts total`);
};

const main = async (): Promise<void> => {
  await postgres.connect();
  await postgres.initializeSchema();

  const userRole = await roleRepository.findRoleByName(EnumRoleName.USER);
  if (!userRole) {
    throw new Error(
      `Role "${EnumRoleName.USER}" not found. Run 'pnpm run seed:permissions:postgres -- --env=development' first.`
    );
  }

  const userRoleId = userRole.id.toString();
  console.log(`Using USER role ID: ${userRoleId}`);

  const userBodies = faker.helpers.multiple(createRandomUserBody, { count: USER_COUNT });
  const userIds = await insertMultipleUsers(userBodies, userRoleId);

  const candidatePeerIds = faker.helpers.multiple(() => faker.helpers.arrayElement(userIds), {
    count: faker.number.int({ min: 0, max: userIds.length })
  });

  await Promise.all([seedFriendshipsForViewer(MYID, [...candidatePeerIds, ...userIds]), insertMultiplePosts(userIds)]);

  console.log('Done');
  await postgres.disconnect();
  process.exit(0);
};

main().catch(async (error) => {
  console.error(error);
  await postgres.disconnect().catch(() => {});
  process.exit(1);
});

export default main;
