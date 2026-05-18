import type { Collection, Db, Document } from 'mongodb';

async function findIndexSafe(collection: Collection<Document>, indexName: string): Promise<Document | null> {
  try {
    const indexes = await collection.listIndexes().toArray();
    return indexes.find((index) => index.name === indexName) ?? null;
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    if (code === 26) return null;
    throw error;
  }
}

export async function up({ context: db }: { context: Db }): Promise<void> {
  const users = db.collection('users');
  const refreshTokens = db.collection('refresh_tokens');
  const otps = db.collection('otps');
  const roles = db.collection('roles');
  const permissions = db.collection('permissions');
  const videoStatuses = db.collection('video_status');
  const friendships = db.collection('friendships');
  const friendRequests = db.collection('friend_requests');
  const blocks = db.collection('blocks');
  const posts = db.collection('posts');
  const bookmarks = db.collection('bookmarks');
  const likes = db.collection('likes');
  const hashtags = db.collection('hashtags');
  const notifications = db.collection('notifications');
  const conversations = db.collection('conversations');
  const conversationMembers = db.collection('conversation_members');
  const chatMessages = db.collection('chat_messages');

  const refreshTokenExpiresAtIndex = await findIndexSafe(refreshTokens, 'expires_at_1');
  if (refreshTokenExpiresAtIndex?.expireAfterSeconds !== undefined) {
    await refreshTokens.dropIndex('expires_at_1');
  }

  await Promise.all([
    users.createIndex({ email: 1, password: 1 }),
    users.createIndex({ username: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } }),
    users.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } }),
    users.createIndex({ name: 'text', username: 'text', email: 'text' }, { default_language: 'none' }),

    refreshTokens.createIndex({ token: 1 }),
    refreshTokens.createIndex({ expires_at: 1 }),

    otps.createIndex({ email: 1, type: 1 }, { unique: true }),
    otps.createIndex({ expires_at: 1 }),

    roles.createIndex({ name: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } }),
    permissions.createIndex({ path: 1, method: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } }),

    videoStatuses.createIndex({ name: 1 }),

    friendships.createIndex({ user_id_low: 1, user_id_high: 1 }, { unique: true }),
    friendships.createIndex({ user_id_low: 1 }),
    friendships.createIndex({ user_id_high: 1 }),

    friendRequests.createIndex({ from_user_id: 1, to_user_id: 1 }, { unique: true }),
    friendRequests.createIndex({ to_user_id: 1, created_at: -1 }),
    friendRequests.createIndex({ from_user_id: 1, created_at: -1 }),
    friendRequests.createIndex({ from_user_id: 1, created_at: 1 }),

    blocks.createIndex({ blocker_id: 1, blocked_id: 1 }, { unique: true }),
    blocks.createIndex({ blocker_id: 1 }),
    blocks.createIndex({ blocked_id: 1 }),

    posts.createIndex({ content: 'text' }, { default_language: 'none' }),
    posts.createIndex({ parent_id: 1, type: 1 }, { partialFilterExpression: { deleted_at: null } }),
    posts.createIndex(
      { parent_id: 1, type: 1, created_at: -1, _id: -1 },
      { partialFilterExpression: { deleted_at: null } }
    ),
    posts.createIndex({ user_id: 1, audience: 1 }, { partialFilterExpression: { deleted_at: null } }),
    posts.createIndex({ audience: 1 }, { partialFilterExpression: { deleted_at: null } }),
    posts.createIndex({ audience: 1, created_at: -1, _id: -1 }, { partialFilterExpression: { deleted_at: null } }),
    posts.createIndex(
      { audience: 1, 'media.type': 1 },
      { name: 'audience_1_media.type_1', partialFilterExpression: { deleted_at: null } }
    ),

    bookmarks.createIndex({ user_id: 1, post_id: 1 }, { unique: true }),
    bookmarks.createIndex({ post_id: 1 }),

    likes.createIndex({ user_id: 1, post_id: 1 }, { unique: true }),
    likes.createIndex({ post_id: 1 }),

    hashtags.createIndex({ name: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } }),

    notifications.createIndex(
      { recipient_id: 1, created_at: -1, _id: -1 },
      { name: 'recipient_id_1_created_at_-1__id_-1', partialFilterExpression: { deleted_at: null } }
    ),

    conversations.createIndex(
      { user_id_low: 1, user_id_high: 1 },
      { unique: true, partialFilterExpression: { type: 'direct', deleted_at: null } }
    ),
    conversations.createIndex({ updated_at: -1 }),

    conversationMembers.createIndex({ conversation_id: 1, user_id: 1 }, { unique: true }),
    conversationMembers.createIndex({ user_id: 1, conversation_id: 1 }),
    conversationMembers.createIndex({ conversation_id: 1, role: 1 }),

    chatMessages.createIndex(
      { conversation_id: 1, created_at: -1, _id: -1 },
      { name: 'conversation_id_1_created_at_-1__id_-1' }
    )
  ]);
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  await Promise.all(
    [
      'users',
      'refresh_tokens',
      'otps',
      'roles',
      'permissions',
      'video_status',
      'friendships',
      'friend_requests',
      'blocks',
      'posts',
      'bookmarks',
      'likes',
      'hashtags',
      'notifications',
      'conversations',
      'conversation_members',
      'chat_messages'
    ].map(async (collectionName) => {
      const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();
      if (exists) await db.collection(collectionName).drop();
    })
  );
}
