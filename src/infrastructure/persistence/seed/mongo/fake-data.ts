/**
 * Seed fake data — clean architecture version.
 * Run: pnpm run seed:fake-data -- --env=development
 *
 * Prerequisites:
 *  1. Run `pnpm run db:migrate:mongo --env=development` first.
 *  2. Run `pnpm run seed:permissions:mongo -- --env=development` first to ensure roles exist.
 *  3. Set MYID to the entity ID of the existing admin/viewer user (format: "entity_<uuidv7>").
 *     You can find it in MongoDB under the `users` collection's `id` field.
 */

import logger from '@/infrastructure/logger/create-logger.js';
import { dbConfig } from '@/infrastructure/persistence/config/database.config.js';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database.js';
import { HashingService } from '@/modules/authentication/infrastructure/services/hashing.service.js';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type.js';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role.impl.repository.js';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper.js';
import { EnumMediaType } from '@/modules/common/domain/enums/media.enum.js';
import { generateUniqueString } from '@/modules/common/utils/random-string.util';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.type.js';
import { Media } from '@/modules/post/domain/value-objects/media.value-object.js';
import { HashtagRepository } from '@/modules/post/infrastructure/persistence/mongo/hashtag.impl.repository.js';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/mongo/hashtag.mapper.js';
import { PostRepository } from '@/modules/post/infrastructure/persistence/mongo/post.impl.repository.js';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper.js';
import {
  FriendshipRepository,
  normalizeFriendshipPair
} from '@/modules/relationship/infrastructure/persistence/mongo/friendship.impl.repository.js';
import { FriendshipMapper } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.mapper.js';
import { UserEntity } from '@/modules/user/domain/entities/user.entity.js';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type.js';
import { UserRepository } from '@/modules/user/infrastructure/persistence/mongo/user.impl.repository.js';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mongo/user.mapper.js';
import { faker } from '@faker-js/faker';

// ID của user viewer/admin đã tồn tại trong DB (format: "entity_<uuidv7>").
// Tìm trong MongoDB collection `users` field `id`.
const MYID = 'user_019e310c-504e-77b2-b685-e213e0a19f9d';
const PASSWORD = '@Bc123';
const USER_COUNT = 10;
const POST_PER_USER = 10;
const HASHTAG_PER_POST = 5;
const MENTION_PER_POST = 5;
const MEDIA_PER_POST = 5;

const mongo = new MongoDatabase({
  uri: dbConfig.mongodb.uri,
  readUri: dbConfig.mongodb.readUri,
  databaseName: dbConfig.mongodb.name
});

const db = mongo.db;
const dbClient = mongo.dbClient;

const hashingService = new HashingService();
const userRepository = new UserRepository(db, dbClient, new UserMapper(), logger);
const postRepository = new PostRepository(db, dbClient, new PostMapper(), logger);
const friendshipRepository = new FriendshipRepository(db, dbClient, new FriendshipMapper(), logger);
const hashtagRepository = new HashtagRepository(db, dbClient, new HashtagMapper(), logger);
const roleRepository = new RoleRepository(db, dbClient, new RoleMapper(), logger);

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
  // 1. type phải là 1 trong 4 giá trị: post, repost, comment, quote.
  // 2. audience: public | friends-only | only-me (phase 3 literals).
  // 3.1. nếu type là repost thì content phải là '' (string rỗng).
  // 3.2. nếu type là post, comment, quote và không có mentions, hashtags thì content phải là string không được rỗng.
  // 4.1. nếu type là repost, comment, quote thì parentId phải là postId của bài viết cha.
  // 4.2. nếu type là post thì parentId phải là null.
  // 5. hashtags phải là mảng các string.
  // 6. mentions phải là mảng các userId.
  // 7. media phải là mảng các media.

  // 1. random type
  const typePool =
    parentPostIds.length === 0
      ? [EnumPostType.POST] // chưa có post gốc nào thì chỉ cho phép POST
      : [EnumPostType.POST, EnumPostType.REPOST, EnumPostType.COMMENT, EnumPostType.QUOTE];

  const randomType = faker.helpers.arrayElement(typePool);

  // 2. random audience (phase 3 literals)
  const randomAudience = faker.helpers.arrayElement([
    EnumPostAudience.PUBLIC,
    EnumPostAudience.FRIENDS_ONLY,
    EnumPostAudience.ONLY_ME
  ]);

  // 3. random hashtags (unique, số lượng 1..HASHTAG_PER_POST)
  // HashtagEntity allows [a-zA-Z0-9_], non-empty, max 100 chars.
  const hashtagCount = faker.number.int({ min: 1, max: HASHTAG_PER_POST });
  const toHashtagName = (word: string) => word.replace(/[^a-zA-Z0-9_]/g, '').replace(/^./, (c) => c.toUpperCase());
  const rawHashtagNames = faker.helpers
    .multiple(() => toHashtagName(faker.word.noun()), { count: HASHTAG_PER_POST * 2 })
    .filter((name) => name.length > 0);
  const uniqueHashtagNames = Array.from(new Set(rawHashtagNames)).slice(0, hashtagCount);

  // 4. random mentions (unique, số lượng 1..MENTION_PER_POST)
  const mentionCount = faker.number.int({ min: 0, max: Math.min(MENTION_PER_POST, mentionedUserIds.length) });
  const rawMentions = faker.helpers.multiple(() => faker.helpers.arrayElement(mentionedUserIds), {
    count: MENTION_PER_POST * 2
  });
  const uniqueMentions = Array.from(new Set(rawMentions)).slice(0, mentionCount);

  const canHaveMedia = randomType === EnumPostType.POST;
  const canHaveSocialMetadata = randomType !== EnumPostType.REPOST;

  // 5. random media (unique theo url, chỉ POST được phép có media)
  const mediaCount = canHaveMedia ? faker.number.int({ min: 1, max: MEDIA_PER_POST }) : 0;
  const mediaMap = new Map<string, { url: string; type: EnumMediaType }>();
  while (mediaMap.size < mediaCount) {
    const url = faker.image.url();
    if (!mediaMap.has(url)) {
      mediaMap.set(url, { url, type: faker.helpers.arrayElement([EnumMediaType.IMAGE, EnumMediaType.VIDEO]) });
    }
  }
  const randomMedia = Array.from(mediaMap.values()).map((m) => new Media(m));

  // 6. content theo đúng rule của PostEntity
  const content = randomType === EnumPostType.REPOST ? '' : faker.lorem.paragraph({ min: 2, max: 5 });

  // 7. parentId theo đúng rule
  // REPOST / COMMENT / QUOTE => phải có parentId là postId của bài viết cha (post gốc)
  const parentId = randomType === EnumPostType.POST ? null : faker.helpers.arrayElement(parentPostIds);

  return {
    userId,
    type: randomType,
    audience: randomAudience,
    allowStrangerComments: faker.datatype.boolean({ probability: 0.7 }),
    content,
    parentId,
    hashtagNames: canHaveSocialMetadata ? uniqueHashtagNames : [],
    mentions: canHaveSocialMetadata ? uniqueMentions : [],
    media: randomMedia
  };
};

const insertMultipleUsers = async (userBodies: UserSeedBody[], roleId: string): Promise<string[]> => {
  console.log('Creating users...');
  const userIds: string[] = [];

  for (const body of userBodies) {
    // random status
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
      username: `user_${generateUniqueString()}`
    });

    const inserted = await userRepository.insert(entity);
    const userId = inserted.id.toString();
    userIds.push(userId);
    console.log(`Created user ${userId}`);
  }

  console.log(`Created ${userIds.length} users`);
  return userIds;
};

/** Seed undirected friendship edges between `viewerId` and distinct other users (normalized pair). */
const seedFriendshipsForViewer = async (viewerId: string, candidatePeerIds: string[]) => {
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
      console.log(`Friendship edge ${userIdLow} — ${userIdHigh}`);
      await friendshipRepository.createFriendship(viewerId, peerId);
      count++;
    } catch (err) {
      console.warn(`Skipped friendship ${viewerId} — ${peerId}:`, (err as Error).message);
    }
  }

  console.log(`Inserted ${count} friendship rows`);
};

const insertMultiplePosts = async (userIds: string[]): Promise<void> => {
  console.log('Creating posts...');
  let count = 0;
  const parentPostIds: string[] = []; // danh sách id các post gốc (type = POST)

  for (const userId of userIds) {
    // Mỗi user tạo POST_PER_USER bài viết (có thể là post gốc hoặc con)
    for (let i = 0; i < POST_PER_USER; i++) {
      const data = createRandomPostData(userId, userIds, parentPostIds);

      const hashtags = await hashtagRepository.insertBulk(data.hashtagNames);
      const hashtagIds = hashtags.map((h) => h.id.toString());

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

      // Nếu là post gốc thì lưu lại id để làm parent cho các post con sau này
      if (post.getProps().type === EnumPostType.POST) {
        parentPostIds.push(post.id.toString());
      }

      count++;
      console.log(`Created post ${count} (type: ${data.type})`);
    }
  }

  console.log(`Created ${count} posts total`);
};

const main = async () => {
  await mongo.connect();

  const userRole = await roleRepository.findRoleByName(EnumRoleName.USER);
  if (!userRole) {
    throw new Error(
      `Role "${EnumRoleName.USER}" not found. Run 'pnpm run seed:permissions -- --env=development' first.`
    );
  }
  const userRoleId = userRole.id.toString();
  console.log(`Using USER role ID: ${userRoleId}`);

  const userBodies = faker.helpers.multiple(createRandomUserBody, { count: USER_COUNT });
  const userIds = await insertMultipleUsers(userBodies, userRoleId);

  // random friend edges từ MYID với số lượng candidate từ 0 đến userIds.length (deduped trong seedFriendshipsForViewer)
  const candidatePeerIds = faker.helpers.multiple(() => faker.helpers.arrayElement(userIds), {
    count: faker.number.int({ min: 0, max: userIds.length })
  });

  await Promise.all([seedFriendshipsForViewer(MYID, [...candidatePeerIds, ...userIds]), insertMultiplePosts(userIds)]);

  console.log('\x1b[32mDone\x1b[0m');
  await mongo.disconnect();
  process.exit(0);
};

main().catch(async (error) => {
  console.error(error);
  await mongo.disconnect().catch(() => {});
  process.exit(1);
});

export default main;
