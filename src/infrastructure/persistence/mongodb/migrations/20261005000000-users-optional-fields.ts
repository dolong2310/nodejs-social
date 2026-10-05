import type { Db } from 'mongodb';

const OPTIONAL_USER_FIELDS = ['totp_secret', 'bio', 'location', 'website', 'username', 'avatar', 'cover_photo'];

export async function up({ context: db }: { context: Db }): Promise<void> {
  const users = db.collection('users');

  // Optional fields used to be written as null; drop them so they read back as undefined.
  await Promise.all(
    OPTIONAL_USER_FIELDS.map((field) => users.updateMany({ [field]: { $type: 'null' } }, { $unset: { [field]: '' } }))
  );

  // A unique index treats every missing username as the same null value, so only one user could omit it.
  await users.dropIndex('username_1');
  await users.createIndex(
    { username: 1 },
    { unique: true, partialFilterExpression: { username: { $type: 'string' }, deleted_at: null } }
  );
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  const users = db.collection('users');

  await users.dropIndex('username_1');
  await users.createIndex({ username: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } });
}
