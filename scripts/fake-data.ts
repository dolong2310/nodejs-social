// // npx tsx scripts/fake-data.ts --env=development
// //
// // Conversations (Phase 4): seed social users/friends như hiện tại; tạo hội thoại/tin qua REST `POST /api/conversations/direct` (sau khi đã verify token) hoặc mở rộng script với `db.initializeConversationIndexes()` + collections `chats` / `chatMembers` / `messages`.

// import { faker } from '@faker-js/faker';
// import { ObjectId } from 'mongodb';
// import { envConfig } from '../src/config/index.js';
// import { ETokenType } from '../src/interfaces/enums/token.enum.js';
// import { RegisterRequestDTO } from '../src/modules/auth/dtos/auth.request.dto.js';
// import { normalizeFriendshipPair } from '../src/modules/friends/friendship.repository.js';
// import { FriendshipEntity } from '../src/modules/friends/friendship.schema.js';
// import { EMediaType } from '../src/modules/media/media.enum.js';
// import { CreatePostRequestDTO } from '../src/modules/posts/dtos/posts.request.dto.js';
// import { EPostAudience, EPostType } from '../src/modules/posts/posts.enum.js';
// import { PostRepository } from '../src/modules/posts/posts.repository.js';
// import { IPost } from '../src/modules/posts/posts.schema.js';
// import { EUserVerificationStatus } from '../src/modules/users/users.enum.js';
// import { UserEntity } from '../src/modules/users/users.schema.js';
// import { DatabaseService } from '../src/infrastructure/persistence/mongodb/database.service.js';
// import { TokenService } from '../src/shared/services/token.service.js';
// import { hashPassword } from '../src/utils/password.util.js';
// import { appConfig } from '../src/config/app.config.js';

// const MYID = '69bc51a34e2dae18a947af8f';
// const PASSWORD = '@Bc123';
// const USER_COUNT = 10;
// const POST_PER_USER = 10;
// const HASHTAG_PER_POST = 10;
// const MENTION_PER_POST = 10;
// const MEDIA_PER_POST = 10;

// const db = new DatabaseService({
//   uri: envConfig.DATABASE_URI,
//   databaseName: envConfig.DATABASE_NAME,
//   chatDatabaseName: envConfig.DATABASE_CHAT_NAME
// });

// const createRandomUserBody = (): RegisterRequestDTO => {
//   const user: RegisterRequestDTO & { confirmPassword: string } = {
//     name: faker.internet.displayName(),
//     email: faker.internet.email(),
//     password: PASSWORD,
//     confirmPassword: PASSWORD,
//     dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).toISOString()
//   };
//   return user;
// };

// const createRandomPostBody = (mentionedUserIds: string[], parentPostIds: string[]): CreatePostRequestDTO => {
//   // 1. type phải là 1 trong 4 giá trị: post, repost, comment, quote.
//   // 2. audience: public | friends-only | only-me (phase 3 literals).
//   // 3.1. nếu type là repost thì content phải là '' (string rỗng).
//   // 3.2. nếu type là post, comment, quote và không có mentions, hashtags thì content phải là string không được rỗng.
//   // 4.1. nếu type là repost, comment, quote thì parentId phải là postId của bài viết cha.
//   // 4.2. nếu type là post thì parentId phải là null.
//   // 5. hashtags phải là mảng các string.
//   // 6. mentions phải là mảng các userId.
//   // 7. media phải là mảng các media.

//   // 1. random type
//   const typePool =
//     parentPostIds.length === 0
//       ? [EPostType.POST] // chưa có post gốc nào thì chỉ cho phép POST
//       : [EPostType.POST, EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE];

//   const randomType = faker.helpers.arrayElement(typePool);

//   // 2. random audience (phase 3 literals)
//   const randomAudience = faker.helpers.arrayElement([
//     EPostAudience.PUBLIC,
//     EPostAudience.FRIENDS_ONLY,
//     EPostAudience.ONLY_ME
//   ]);

//   // 3. random hashtags (unique, số lượng 1..HASHTAG_PER_POST)
//   const randomHashtagsRaw = faker.helpers.multiple(() => faker.lorem.word(), {
//     count: HASHTAG_PER_POST * 2
//   });
//   const hashtagCount = faker.number.int({ min: 1, max: HASHTAG_PER_POST });
//   const randomHashtags = Array.from(new Set(randomHashtagsRaw)).slice(0, hashtagCount);

//   // 4. random mentions (unique, số lượng 1..MENTION_PER_POST)
//   const randomMentionsRaw = faker.helpers.multiple(() => faker.helpers.arrayElement(mentionedUserIds), {
//     count: MENTION_PER_POST * 2
//   });
//   const mentionCount = faker.number.int({ min: 1, max: MENTION_PER_POST });
//   const randomMentions = Array.from(new Set(randomMentionsRaw)).slice(0, mentionCount);

//   // 5. random media (unique theo url, số lượng 1..MEDIA_PER_POST)
//   const randomMediaRaw = faker.helpers.multiple(
//     () => ({
//       url: faker.image.url(),
//       type: faker.helpers.arrayElement([EMediaType.IMAGE, EMediaType.VIDEO])
//     }),
//     { count: MEDIA_PER_POST * 2 }
//   );
//   const mediaMap = new Map<string, { url: string; type: EMediaType }>();
//   for (const m of randomMediaRaw) {
//     if (!mediaMap.has(m.url)) mediaMap.set(m.url, m);
//   }
//   const mediaCount = faker.number.int({ min: 1, max: MEDIA_PER_POST });
//   const randomMedia = Array.from(mediaMap.values()).slice(0, mediaCount);

//   // 6. random content
//   const content = randomType === EPostType.REPOST ? '' : faker.lorem.paragraph({ min: 10, max: 20 });

//   // 7. parentId theo đúng rule
//   let parentId: string | null;
//   if (randomType === EPostType.POST) {
//     parentId = null;
//   } else {
//     // REPOST / COMMENT / QUOTE → phải có parentId là postId của bài viết cha (post gốc)
//     parentId = faker.helpers.arrayElement(parentPostIds);
//   }

//   const post: CreatePostRequestDTO = {
//     type: randomType,
//     audience: randomAudience,
//     allowStrangerComments: faker.datatype.boolean({ probability: 0.7 }),
//     content,
//     parentId,
//     hashtags: randomHashtags,
//     mentions: randomMentions,
//     media: randomMedia
//   };

//   return post;
// };

// const insertMultipleUsers = async (userBodies: RegisterRequestDTO[]): Promise<ObjectId[]> => {
//   console.log('Creating users...');
//   const createdUsers = await Promise.all(
//     userBodies.map(async (userBody) => {
//       // random verificationStatus
//       const randomVerificationStatus = faker.helpers.arrayElement([
//         EUserVerificationStatus.VERIFIED,
//         EUserVerificationStatus.UNVERIFIED,
//         EUserVerificationStatus.BANNED
//       ]);

//       const user = await db.users.insertOne(
//         new UserEntity({
//           ...userBody,
//           username: `user-${new ObjectId().toString()}`,
//           password: await hashPassword(userBody.password),
//           dateOfBirth: new Date(userBody.dateOfBirth),
//           verificationStatus: randomVerificationStatus
//         })
//       );

//       // update emailVerificationToken if user is unverified
//       if (randomVerificationStatus === EUserVerificationStatus.UNVERIFIED) {
//         const tokenService = new TokenService(appConfig);
//         const emailVerificationToken = await tokenService.signEmailVerificationToken({
//           userId: user.insertedId.toString(),
//           type: ETokenType.EMAIL_VERIFICATION_TOKEN
//         });

//         await db.users.updateOne({ _id: user.insertedId }, { $set: { emailVerificationToken } });
//       }

//       console.log(`Created user ${user.insertedId}`);
//       return user.insertedId;
//     })
//   ).catch();
//   console.log(`Created ${createdUsers.length} users`);
//   return createdUsers;
// };

// /** Seed undirected friendship edges between `viewerId` and distinct other users (normalized pair). */
// const seedFriendshipsForViewer = async (viewerId: ObjectId, candidatePeerIds: ObjectId[]) => {
//   const seen = new Set<string>();
//   const peers = candidatePeerIds.filter((peerId) => {
//     if (peerId.equals(viewerId)) return false;
//     const k = peerId.toString();
//     if (seen.has(k)) return false;
//     seen.add(k);
//     return true;
//   });
//   console.log('Seeding friendships for viewer...');
//   const results = await Promise.all(
//     peers.map((peerId) => {
//       const { userIdLow, userIdHigh } = normalizeFriendshipPair(viewerId, peerId);
//       console.log(`Friendship edge ${userIdLow.toString()} — ${userIdHigh.toString()}`);
//       return db.friendships.insertOne(
//         new FriendshipEntity({
//           userIdLow,
//           userIdHigh,
//           createdAt: new Date()
//         })
//       );
//     })
//   ).catch(() => []);
//   console.log(`Inserted ${results.length} friendship rows`);
//   return results;
// };

// const insertMultiplePosts = async (userIds: string[]): Promise<IPost[]> => {
//   console.log('Creating posts...');
//   console.log('Counting...');

//   const postRepository = new PostRepository(db);

//   let count = 0;
//   const parentPostIds: string[] = []; // danh sách _id các post gốc (type = POST)

//   const createdPosts = await Promise.all(
//     userIds.map(async (userId) => {
//       // Mỗi user tạo POST_PER_USER bài viết (có thể là post gốc hoặc con)
//       for (let i = 0; i < POST_PER_USER; i++) {
//         const body = createRandomPostBody(userIds, parentPostIds);

//         const hashtags = (await postRepository.findAndUpsertHashtags(body.hashtags)).filter((h) => h !== null);
//         const hashtagIds = hashtags.map((hashtag) => hashtag._id);
//         const newPost = await postRepository.createPost({ userId, body: { ...body, hashtags: hashtagIds } });

//         // Nếu là post gốc thì lưu lại _id để làm parent cho các post con sau này
//         if (newPost.type === EPostType.POST && newPost._id) {
//           parentPostIds.push(newPost._id.toString());
//         }

//         count += 1;
//         console.log(`Created ${count} posts`);
//         return newPost;
//       }
//     })
//   ).catch();

//   console.log(`Created ${createdPosts.length} users' posts`);
//   return createdPosts as IPost[];
// };

// const main = async () => {
//   const userBodies: RegisterRequestDTO[] = faker.helpers.multiple(createRandomUserBody, { count: USER_COUNT });
//   const userIds = await insertMultipleUsers(userBodies).catch();
//   // random friend edges from MYID với số lượng candidate từ 0 đến 1000 (deduped trong seedFriendshipsForViewer)
//   const candidatePeerIds = faker.helpers.multiple(() => faker.helpers.arrayElement(userIds), {
//     count: faker.number.int({ min: 0, max: 1000 })
//   });
//   await Promise.all([
//     seedFriendshipsForViewer(new ObjectId(MYID), candidatePeerIds),
//     insertMultiplePosts(userIds.map((userId) => userId.toString()))
//   ]).catch();
//   console.log(`\x1b[32mDone\x1b[0m`);
// };

// main().catch((error) => {
//   console.error(error);
//   process.exit(0);
// });

// export default main;
