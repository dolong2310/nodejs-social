import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Pool } from 'pg';

const log = logger.child({ module: 'postgres-database-service' });

export interface PostgresDatabasePort extends DatabasePort {
  pool: Pool;
  readPool: Pool;
  readPools: Pool[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  initializeSchema(): Promise<void>;
}

export class PostgresDatabase implements PostgresDatabasePort {
  public pool: Pool;
  public readPool: Pool;
  public readPools: Pool[];
  private currentReadIndex = 0;

  constructor(readonly config: { uri: string; readUris: string[]; ssl?: boolean }) {
    const { uri, readUris, ssl } = config;

    this.pool = new Pool({
      connectionString: uri,
      ssl: ssl ? { rejectUnauthorized: false } : undefined
    });
    this.readPools = readUris.map(
      (uri) =>
        new Pool({
          connectionString: uri,
          ssl: ssl ? { rejectUnauthorized: false } : undefined
        })
    );
    this.readPool = this.readPools.length > 0 ? this.createReplicaPoolRouter() : this.pool;
  }

  private createReplicaPoolRouter(): Pool {
    const [basePool] = this.readPools;
    if (!basePool) return this.pool;

    // round robin algorithm to get the next replica pool
    // example: [pool1, pool2, pool3] -> pool1, pool2, pool3, pool1, pool2, pool3, ...
    const getNextReplicaPool = (): Pool => {
      if (this.readPools.length === 0) return this.pool;
      const pool = this.readPools[this.currentReadIndex % this.readPools.length] ?? this.pool;
      this.currentReadIndex = (this.currentReadIndex + 1) % this.readPools.length;
      return pool;
    };

    const query = ((...args: unknown[]) => {
      const pool = getNextReplicaPool();
      return Reflect.apply(pool.query, pool, args);
    }) as Pool['query'];

    // proxy to the base pool to get the next replica pool
    // example: basePool.query -> getNextReplicaPool().query
    return new Proxy(basePool, {
      get(target, property, receiver) {
        if (property === 'query') return query;

        const value = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  }

  async connect(): Promise<void> {
    const handleConnect = async (pool: Pool, errorMessage?: string) => {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } catch (error) {
        log.error({ err: error }, errorMessage ?? 'postgres:::error-connecting');
        await this.disconnect();
        throw error;
      } finally {
        client.release();
      }
    };

    await handleConnect(this.pool);

    await Promise.all(
      this.readPools.map(async (pool, index) => {
        await handleConnect(pool, `postgres:::error-connecting-to-replica-${index}`);
      })
    );

    log.info({ replicas: this.readPools.length }, 'postgres:::connected');
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.pool.end(), ...this.readPools.map((pool) => pool.end())]);
  }

  async initializeSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        path TEXT NOT NULL,
        method TEXT NOT NULL,
        module TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT permissions_path_method_not_empty CHECK (length(path) > 0 AND length(method) > 0)
      );

      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        birthday TIMESTAMPTZ NOT NULL,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'UNKNOWN')),
        totp_secret TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        username TEXT,
        avatar TEXT,
        cover_photo TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('LOGIN', 'REGISTER', 'FORGOT_PASSWORD', 'DISABLE_2FA')),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT otps_email_type_unique UNIQUE (email, type)
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT blocks_blocker_blocked_unique UNIQUE (blocker_id, blocked_id),
        CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_id)
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id TEXT PRIMARY KEY,
        user_id_low TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_high TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT friendships_user_pair_unique UNIQUE (user_id_low, user_id_high),
        CONSTRAINT friendships_canonical_pair CHECK (user_id_low < user_id_high)
      );

      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT friend_requests_from_to_unique UNIQUE (from_user_id, to_user_id),
        CONSTRAINT friend_requests_no_self_request CHECK (from_user_id <> to_user_id)
      );

      CREATE TABLE IF NOT EXISTS hashtags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT hashtags_name_not_empty CHECK (length(name) > 0),
        CONSTRAINT hashtags_name_max_length CHECK (length(name) <= 100)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('post', 'repost', 'comment', 'quote')),
        audience TEXT NOT NULL CHECK (audience IN ('public', 'friends-only', 'only-me')),
        allow_stranger_comments BOOLEAN NOT NULL DEFAULT TRUE,
        content TEXT NOT NULL,
        parent_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        hashtags TEXT[] NOT NULL DEFAULT '{}',
        mentions TEXT[] NOT NULL DEFAULT '{}',
        media JSONB NOT NULL DEFAULT '[]'::jsonb,
        guest_views INTEGER NOT NULL DEFAULT 0 CHECK (guest_views >= 0),
        user_views INTEGER NOT NULL DEFAULT 0 CHECK (user_views >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ
      );

      COMMENT ON COLUMN posts.hashtags IS
        'Mongo-shape migration field. Revisit normalization when post updates include hashtags.';
      COMMENT ON COLUMN posts.mentions IS
        'Mongo-shape migration field. Revisit normalization when post updates include mentions.';
      COMMENT ON COLUMN posts.media IS
        'Mongo-shape migration field. Revisit JSONB/normalization when post updates include media/content.';

      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT bookmarks_user_post_unique UNIQUE (user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        name TEXT,
        avatar_media_id TEXT,
        user_id_low TEXT REFERENCES users(id) ON DELETE RESTRICT,
        user_id_high TEXT REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT conversations_direct_shape CHECK (
          (type = 'direct' AND user_id_low IS NOT NULL AND user_id_high IS NOT NULL AND user_id_low <> user_id_high AND name IS NULL AND avatar_media_id IS NULL)
          OR (type = 'group' AND name IS NOT NULL AND length(name) > 0 AND user_id_low IS NULL AND user_id_high IS NULL)
        ),
        CONSTRAINT conversations_direct_canonical_pair CHECK (
          type <> 'direct' OR user_id_low < user_id_high
        )
      );

      CREATE TABLE IF NOT EXISTS conversation_members (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
        joined_at TIMESTAMPTZ NOT NULL,
        last_read_at TIMESTAMPTZ,
        last_read_message_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT conversation_members_conversation_user_unique UNIQUE (conversation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        text TEXT,
        attachments JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT chat_messages_attachments_array CHECK (
          attachments IS NULL OR jsonb_typeof(attachments) = 'array'
        ),
        CONSTRAINT chat_messages_content_not_empty CHECK (
          length(coalesce(text, '')) > 0
          OR jsonb_array_length(coalesce(attachments, '[]'::jsonb)) > 0
        )
      );

      COMMENT ON COLUMN chat_messages.attachments IS
        'Mongo-shape migration field. Revisit normalization after media persistence is fully migrated.';

      CREATE TABLE IF NOT EXISTS video_status (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'failed')),
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ,
        CONSTRAINT video_status_name_unique UNIQUE (name),
        CONSTRAINT video_status_name_not_empty CHECK (length(btrim(name)) > 0)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        type TEXT NOT NULL CHECK (type IN ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'NEW_MESSAGE', 'ADDED_TO_GROUP')),
        actor JSONB NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by_id TEXT,
        updated_by_id TEXT,
        deleted_by_id TEXT,
        deleted_at TIMESTAMPTZ
      );

      COMMENT ON COLUMN notifications.actor IS
        'Mongo-shape migration field. Embedded actor snapshot preserves display behavior when actor profile changes.';
      COMMENT ON COLUMN notifications.payload IS
        'Mongo-shape migration field. Revisit normalization after conversation persistence is migrated.';

      DO $$
      BEGIN
        ALTER TABLE conversations
        DROP CONSTRAINT IF EXISTS conversations_created_by_fkey,
        DROP CONSTRAINT IF EXISTS conversations_user_id_low_fkey,
        DROP CONSTRAINT IF EXISTS conversations_user_id_high_fkey,
        DROP CONSTRAINT IF EXISTS conversations_direct_shape;

        ALTER TABLE conversations
        ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
        ADD CONSTRAINT conversations_user_id_low_fkey FOREIGN KEY (user_id_low) REFERENCES users(id) ON DELETE RESTRICT,
        ADD CONSTRAINT conversations_user_id_high_fkey FOREIGN KEY (user_id_high) REFERENCES users(id) ON DELETE RESTRICT,
        ADD CONSTRAINT conversations_direct_shape CHECK (
          (type = 'direct' AND user_id_low IS NOT NULL AND user_id_high IS NOT NULL AND user_id_low <> user_id_high AND name IS NULL AND avatar_media_id IS NULL)
          OR (type = 'group' AND name IS NOT NULL AND length(name) > 0 AND user_id_low IS NULL AND user_id_high IS NULL)
        );

        ALTER TABLE chat_messages
        DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
        DROP CONSTRAINT IF EXISTS chat_messages_attachments_array;

        ALTER TABLE chat_messages
        ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
        ADD CONSTRAINT chat_messages_attachments_array CHECK (
          attachments IS NULL OR jsonb_typeof(attachments) = 'array'
        );

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'video_status_name_unique'
        ) THEN
          ALTER TABLE video_status
          ADD CONSTRAINT video_status_name_unique UNIQUE (name);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'video_status_name_not_empty'
        ) THEN
          ALTER TABLE video_status
          ADD CONSTRAINT video_status_name_not_empty CHECK (length(btrim(name)) > 0);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'video_status_status_check'
        ) THEN
          ALTER TABLE video_status
          ADD CONSTRAINT video_status_status_check CHECK (status IN ('pending', 'processing', 'success', 'failed'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'likes_post_id_fk'
        ) THEN
          ALTER TABLE likes
          ADD CONSTRAINT likes_post_id_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_post_id_fk'
        ) THEN
          ALTER TABLE bookmarks
          ADD CONSTRAINT bookmarks_post_id_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
        END IF;
      END $$;

      ALTER TABLE permissions
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE otps
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE refresh_tokens
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE blocks
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE friendships
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE friend_requests
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE hashtags
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE likes
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE bookmarks
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE conversation_members
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE video_status
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      ALTER TABLE notifications
        ADD COLUMN IF NOT EXISTS created_by_id TEXT,
        ADD COLUMN IF NOT EXISTS updated_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_by_id TEXT,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

      UPDATE users
      SET
        email = lower(btrim(email)),
        username = NULLIF(lower(btrim(username)), ''),
        updated_at = NOW()
      WHERE email <> lower(btrim(email))
        OR username IS DISTINCT FROM NULLIF(lower(btrim(username)), '');

      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
        position INTEGER NOT NULL,
        PRIMARY KEY (role_id, permission_id)
      );

      ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_path_method_unique;
      ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
      ALTER TABLE hashtags DROP CONSTRAINT IF EXISTS hashtags_name_key;

      DROP INDEX IF EXISTS users_email_lower_unique;
      DROP INDEX IF EXISTS users_username_lower_unique;
      DROP INDEX IF EXISTS conversations_direct_pair_unique;

      CREATE UNIQUE INDEX IF NOT EXISTS permissions_path_method_active_unique ON permissions(path, method) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS roles_name_active_unique ON roles(name) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS hashtags_name_active_unique ON hashtags(name) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);
      CREATE INDEX IF NOT EXISTS role_permissions_role_id_position_idx ON role_permissions(role_id, position);
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_active_unique ON users (lower(email)) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_active_unique ON users (lower(username)) WHERE username IS NOT NULL AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS users_role_id_idx ON users(role_id);
      CREATE INDEX IF NOT EXISTS users_created_at_id_idx ON users(created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS otps_expires_at_idx ON otps(expires_at);
      CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx ON blocks(blocked_id);
      CREATE INDEX IF NOT EXISTS friendships_user_id_high_low_idx ON friendships(user_id_high, user_id_low);
      CREATE INDEX IF NOT EXISTS friend_requests_to_created_id_idx ON friend_requests(to_user_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS friend_requests_from_created_id_idx ON friend_requests(from_user_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS posts_parent_type_created_id_active_idx ON posts(parent_id, type, created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS posts_user_audience_active_idx ON posts(user_id, audience) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS posts_audience_created_id_active_idx ON posts(audience, created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS posts_created_id_active_idx ON posts(created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS posts_media_gin_idx ON posts USING GIN (media jsonb_path_ops);
      CREATE INDEX IF NOT EXISTS posts_content_fts_idx ON posts USING GIN (to_tsvector('simple', content));
      CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes(post_id);
      CREATE INDEX IF NOT EXISTS bookmarks_post_id_idx ON bookmarks(post_id);
      CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_pair_active_unique
        ON conversations(user_id_low, user_id_high)
        WHERE type = 'direct' AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS conversations_updated_id_active_idx ON conversations(updated_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON conversations(created_by);
      CREATE INDEX IF NOT EXISTS conversation_members_user_conversation_idx ON conversation_members(user_id, conversation_id);
      CREATE INDEX IF NOT EXISTS conversation_members_conversation_joined_idx ON conversation_members(conversation_id, joined_at ASC, id ASC);
      CREATE INDEX IF NOT EXISTS conversation_members_conversation_role_idx ON conversation_members(conversation_id, role);
      CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_id_active_idx ON chat_messages(conversation_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS notifications_recipient_created_id_active_idx ON notifications(recipient_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS notifications_recipient_unread_active_idx ON notifications(recipient_id) WHERE read = FALSE AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS notifications_recipient_trim_active_idx ON notifications(recipient_id, read DESC, created_at ASC, id ASC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS notifications_actor_user_id_idx ON notifications((actor->>'userId'));
    `);
  }
}
