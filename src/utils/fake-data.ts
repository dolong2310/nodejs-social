import { DatabaseInstance } from '@/database';
import { EMediaType } from '@/enums/media.enum';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { IRegisterRequestBody } from '@/models/requests/auth.request';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import FollowerSchema from '@/models/schemas/follower.schema';
import { IPost } from '@/models/schemas/post.schema';
import UserSchema from '@/models/schemas/user.schema';
import { PostRepository } from '@/repositories/post.repository';
import PostsService from '@/services/posts.service';
import TokenService from '@/services/token.service';
import { hashPassword } from '@/utils/helper.util';
import { faker } from '@faker-js/faker';
import { ObjectId } from 'mongodb';

const MYID = '69b3f6e3e07d783dbde0a80b';
const PASSWORD = '@Bc123';
const USER_COUNT = 1000;
const POST_PER_USER = 10;
const HASHTAG_PER_POST = 10;
const MENTION_PER_POST = 10;
const MEDIA_PER_POST = 10;

const db = () => DatabaseInstance.get();

const createRandomUserBody = (): IRegisterRequestBody => {
  const user: IRegisterRequestBody & { confirmPassword: string } = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).toISOString()
  };
  return user;
};

const createRandomPostBody = (mentionedUserIds: string[], parentPostIds: string[]): ICreatePostRequestBody => {
  // 1. type phải là 1 trong 4 giá trị: post, repost, comment, quote.
  // 2. audience phải là 1 trong 3 giá trị: public, followers, only_me.
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
      ? [EPostType.POST] // chưa có post gốc nào thì chỉ cho phép POST
      : [EPostType.POST, EPostType.REPOST, EPostType.COMMENT, EPostType.QUOTE];

  const randomType = faker.helpers.arrayElement(typePool);

  // 2. random audience
  const randomAudience = faker.helpers.arrayElement([
    EPostAudience.PUBLIC,
    EPostAudience.FOLLOWERS,
    EPostAudience.ONLY_ME
  ]);

  // 3. random hashtags (unique, số lượng 1..HASHTAG_PER_POST)
  const randomHashtagsRaw = faker.helpers.multiple(() => faker.lorem.word(), {
    count: HASHTAG_PER_POST * 2
  });
  const hashtagCount = faker.number.int({ min: 1, max: HASHTAG_PER_POST });
  const randomHashtags = Array.from(new Set(randomHashtagsRaw)).slice(0, hashtagCount);

  // 4. random mentions (unique, số lượng 1..MENTION_PER_POST)
  const randomMentionsRaw = faker.helpers.multiple(() => faker.helpers.arrayElement(mentionedUserIds), {
    count: MENTION_PER_POST * 2
  });
  const mentionCount = faker.number.int({ min: 1, max: MENTION_PER_POST });
  const randomMentions = Array.from(new Set(randomMentionsRaw)).slice(0, mentionCount);

  // 5. random media (unique theo url, số lượng 1..MEDIA_PER_POST)
  const randomMediaRaw = faker.helpers.multiple(
    () => ({
      url: faker.image.url(),
      type: faker.helpers.arrayElement([EMediaType.IMAGE, EMediaType.VIDEO])
    }),
    { count: MEDIA_PER_POST * 2 }
  );
  const mediaMap = new Map<string, { url: string; type: EMediaType }>();
  for (const m of randomMediaRaw) {
    if (!mediaMap.has(m.url)) mediaMap.set(m.url, m);
  }
  const mediaCount = faker.number.int({ min: 1, max: MEDIA_PER_POST });
  const randomMedia = Array.from(mediaMap.values()).slice(0, mediaCount);

  // 6. random content
  const content = randomType === EPostType.REPOST ? '' : faker.lorem.paragraph({ min: 10, max: 20 });

  // 7. parentId theo đúng rule
  let parentId: string | null;
  if (randomType === EPostType.POST) {
    parentId = null;
  } else {
    // REPOST / COMMENT / QUOTE → phải có parentId là postId của bài viết cha (post gốc)
    parentId = faker.helpers.arrayElement(parentPostIds);
  }

  const post: ICreatePostRequestBody = {
    type: randomType,
    audience: randomAudience,
    content,
    parentId,
    hashtags: randomHashtags,
    mentions: randomMentions,
    media: randomMedia
  };

  return post;
};

const insertMultipleUsers = async (userBodies: IRegisterRequestBody[]): Promise<ObjectId[]> => {
  console.log('Creating users...');
  const createdUsers = await Promise.all(
    userBodies.map(async (userBody) => {
      // random verificationStatus
      const randomVerificationStatus = faker.helpers.arrayElement([
        EUserVerificationStatus.VERIFIED,
        EUserVerificationStatus.UNVERIFIED,
        EUserVerificationStatus.BANNED
      ]);

      const user = await db().users.insertOne(
        new UserSchema({
          ...userBody,
          username: `user-${new ObjectId().toString()}`,
          password: await hashPassword(userBody.password),
          dateOfBirth: new Date(userBody.dateOfBirth),
          verificationStatus: randomVerificationStatus
        })
      );

      // update emailVerificationToken if user is unverified
      if (randomVerificationStatus === EUserVerificationStatus.UNVERIFIED) {
        const tokenService = new TokenService();
        const emailVerificationToken = await tokenService.signEmailVerificationToken({
          userId: user.insertedId.toString(),
          type: ETokenType.EMAIL_VERIFICATION_TOKEN
        });

        await db().users.updateOne({ _id: user.insertedId }, { $set: { emailVerificationToken } });
      }

      console.log(`Created user ${user.insertedId}`);
      return user.insertedId;
    })
  );
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
};

const followMultipleUsers = async (userId: ObjectId, followedUserIds: ObjectId[]) => {
  console.log('Start following users...');
  const followedUsers = await Promise.all(
    followedUserIds.map((followedUserId) => {
      console.log(`Following user ${followedUserId}`);
      return db().followers.insertOne(
        new FollowerSchema({
          userId,
          followedUserId
        })
      );
    })
  );
  console.log(`Followed ${followedUsers.length} users`);
  return followedUsers;
};

const insertMultiplePosts = async (userIds: string[]): Promise<IPost[]> => {
  console.log('Creating posts...');
  console.log('Counting...');

  let count = 0;
  const parentPostIds: string[] = []; // danh sách _id các post gốc (type = POST)

  const createdPosts = await Promise.all(
    userIds.map(async (userId) => {
      // Mỗi user tạo POST_PER_USER bài viết (có thể là post gốc hoặc con)
      for (let i = 0; i < POST_PER_USER; i++) {
        const body = createRandomPostBody(userIds, parentPostIds);

        const postsService = new PostsService(new PostRepository(DatabaseInstance.get()));
        const newPost = await postsService.createPost({ userId, body });

        // Nếu là post gốc thì lưu lại _id để làm parent cho các post con sau này
        if (newPost.type === EPostType.POST && newPost._id) {
          parentPostIds.push(newPost._id.toString());
        }

        count += 1;
        console.log(`Created ${count} posts`);
        return newPost;
      }
    })
  );

  console.log(`Created ${createdPosts.length} users' posts`);
  return createdPosts as IPost[];
};

const main = async () => {
  const userBodies: IRegisterRequestBody[] = faker.helpers.multiple(createRandomUserBody, { count: USER_COUNT });
  const userIds = await insertMultipleUsers(userBodies).catch();
  // random follow users với số lượng từ 0 đến 1000
  const followedUserIds = faker.helpers.multiple(() => faker.helpers.arrayElement(userIds), {
    count: faker.number.int({ min: 0, max: 1000 })
  });
  await Promise.all([
    followMultipleUsers(new ObjectId(MYID), followedUserIds),
    insertMultiplePosts(userIds.map((userId) => userId.toString()))
  ]);
  console.log(`\x1b[32mDone\x1b[0m`);
};

export default main;
