import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Pool } from 'pg';

const log = logger.child({ module: 'postgres-database-service' });

export interface PostgresDatabasePort extends DatabasePort {
  pool: Pool;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  initializeSchema(): Promise<void>;
}

export class PostgresDatabase implements PostgresDatabasePort {
  public pool: Pool;

  constructor(readonly config: { uri: string; ssl?: boolean }) {
    this.pool = new Pool({
      connectionString: config.uri,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined
    });
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      log.info('connected to postgres');
    } catch (error) {
      log.error({ err: error }, 'error connecting to postgres');
      await this.disconnect();
      throw error;
    } finally {
      client.release();
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
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
        CONSTRAINT permissions_path_method_unique UNIQUE (path, method)
      );

      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        birthday TIMESTAMPTZ NOT NULL,
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'UNKNOWN')),
        totp_secret TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        username TEXT UNIQUE,
        avatar TEXT,
        cover_photo TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('LOGIN', 'REGISTER', 'FORGOT_PASSWORD', 'DISABLE_2FA')),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT otps_email_type_unique UNIQUE (email, type)
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT blocks_blocker_blocked_unique UNIQUE (blocker_id, blocked_id),
        CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_id)
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id TEXT PRIMARY KEY,
        user_id_low TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_high TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT friendships_user_pair_unique UNIQUE (user_id_low, user_id_high),
        CONSTRAINT friendships_canonical_pair CHECK (user_id_low < user_id_high)
      );

      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT friend_requests_from_to_unique UNIQUE (from_user_id, to_user_id),
        CONSTRAINT friend_requests_no_self_request CHECK (from_user_id <> to_user_id)
      );

      CREATE TABLE IF NOT EXISTS hashtags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

      CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);
      CREATE INDEX IF NOT EXISTS role_permissions_role_id_position_idx ON role_permissions(role_id, position);
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique ON users (lower(username)) WHERE username IS NOT NULL;
      CREATE INDEX IF NOT EXISTS users_role_id_idx ON users(role_id);
      CREATE INDEX IF NOT EXISTS users_created_at_id_idx ON users(created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS otps_expires_at_idx ON otps(expires_at);
      CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx ON blocks(blocked_id);
      CREATE INDEX IF NOT EXISTS friendships_user_id_high_low_idx ON friendships(user_id_high, user_id_low);
      CREATE INDEX IF NOT EXISTS friend_requests_to_created_id_idx ON friend_requests(to_user_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS friend_requests_from_created_id_idx ON friend_requests(from_user_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS posts_parent_type_created_id_idx ON posts(parent_id, type, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS posts_user_audience_idx ON posts(user_id, audience);
      CREATE INDEX IF NOT EXISTS posts_audience_created_id_idx ON posts(audience, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS posts_created_id_idx ON posts(created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS posts_media_gin_idx ON posts USING GIN (media jsonb_path_ops);
      CREATE INDEX IF NOT EXISTS posts_content_fts_idx ON posts USING GIN (to_tsvector('simple', content));
      CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes(post_id);
      CREATE INDEX IF NOT EXISTS bookmarks_post_id_idx ON bookmarks(post_id);
      CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_pair_unique
        ON conversations(user_id_low, user_id_high)
        WHERE type = 'direct';
      CREATE INDEX IF NOT EXISTS conversations_updated_id_idx ON conversations(updated_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON conversations(created_by);
      CREATE INDEX IF NOT EXISTS conversation_members_user_conversation_idx ON conversation_members(user_id, conversation_id);
      CREATE INDEX IF NOT EXISTS conversation_members_conversation_joined_idx ON conversation_members(conversation_id, joined_at ASC, id ASC);
      CREATE INDEX IF NOT EXISTS conversation_members_conversation_role_idx ON conversation_members(conversation_id, role);
      CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_id_idx ON chat_messages(conversation_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx ON chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS notifications_recipient_created_id_idx ON notifications(recipient_id, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx ON notifications(recipient_id) WHERE read = FALSE;
      CREATE INDEX IF NOT EXISTS notifications_recipient_trim_idx ON notifications(recipient_id, read DESC, created_at ASC, id ASC);
      CREATE INDEX IF NOT EXISTS notifications_actor_user_id_idx ON notifications((actor->>'userId'));
    `);
  }
}
