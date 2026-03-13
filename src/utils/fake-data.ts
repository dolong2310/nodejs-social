import { PostAudience, PostType } from '@/enums/posts.enum';
import { UserVerificationStatus } from '@/enums/users.enum';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IRegisterRequestBody } from '@/models/requests/user.request';
import FollowerSchema from '@/models/schemas/follower.schema';
import UserSchema from '@/models/schemas/user.schema';
import databaseService from '@/services/database.service';
import postsService from '@/services/posts.service';
import { hashPassword } from '@/utils/helper.util';
import { faker } from '@faker-js/faker';
import { ObjectId } from 'mongodb';

const MYID = '69b3278f85738134df452c4b';
const PASSWORD = '@Bc123';
const USER_COUNT = 1000;
const POST_PER_USER = 10;

const createRandomUserBody = (): IRegisterRequestBody => {
  const user: IRegisterRequestBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }).toISOString()
  };
  return user;
};

const createRandomPostBody = (): ICreatePostRequestBody => {
  // 1. type phải là 1 trong 4 giá trị: post, repost, comment, quote.
  // 2. audience phải là 1 trong 3 giá trị: public, followers, only_me.
  // 3.1. nếu type là repost thì content phải là '' (string rỗng).
  // 3.2. nếu type là post, comment, quote và không có mentions, hashtags thì content phải là string không được rỗng.
  // Bỏ qua các điều kiện: 4.1, 5, 6, 7 theo yêu cầu.

  const randomType = faker.helpers.arrayElement([PostType.POST, PostType.REPOST, PostType.COMMENT, PostType.QUOTE]);

  const randomAudience = faker.helpers.arrayElement([
    PostAudience.PUBLIC,
    PostAudience.FOLLOWERS,
    PostAudience.ONLY_ME
  ]);

  const content =
    randomType === PostType.REPOST
      ? ''
      : faker.lorem.paragraph({
          min: 10,
          max: 20
        });

  const post: ICreatePostRequestBody = {
    type: randomType,
    audience: randomAudience,
    content,
    parentId: null,
    hashtags: [],
    mentions: [],
    media: []
  };

  return post;
};

const insertMultipleUsers = async (userBodies: IRegisterRequestBody[]): Promise<ObjectId[]> => {
  console.log('Creating users...');
  const createdUsers = await Promise.all(
    userBodies.map(async (userBody) => {
      const user = await databaseService.users.insertOne(
        new UserSchema({
          ...userBody,
          username: `user-${new ObjectId().toString()}`,
          password: await hashPassword(userBody.password),
          dateOfBirth: new Date(userBody.dateOfBirth),
          verificationStatus: UserVerificationStatus.VERIFIED
        })
      );
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
      return databaseService.followers.insertOne(
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

const insertMultiplePosts = async (ids: ObjectId[]): Promise<void[]> => {
  console.log('Creating posts...');
  console.log('Counting...');
  let count = 0;
  const createdPosts = await Promise.all(
    ids.map(async (id) => {
      await Promise.all(
        Array.from({ length: POST_PER_USER }).map(() =>
          postsService.createPost({ userId: id.toString(), body: createRandomPostBody() })
        )
      );
      count += 2;
      console.log(`Created ${count} posts`);
    })
  );
  console.log(`Created ${createdPosts.length} posts`);
  return createdPosts;
};

const main = async () => {
  const userBodies: IRegisterRequestBody[] = faker.helpers.multiple(createRandomUserBody, { count: USER_COUNT });
  const userIds = await insertMultipleUsers(userBodies).catch();
  const halfUserIds = userIds.slice(0, USER_COUNT / 2);
  await Promise.all([followMultipleUsers(new ObjectId(MYID), halfUserIds), insertMultiplePosts(userIds)]);
  console.log('Done');
};

export default main;
