import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { EnumPostAudience, EnumPostType } from '@/modules/post/domain/entities/post.types';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import {
  FindGuestPostsInput,
  FindPostIdsWhereUserInteractedWithAuthorsInput,
  FindPostsByUserIdInput,
  FindPostsByUserInteractionInput,
  FindPostsForSearchInput,
  FindPostsInput,
  FindPostsTypeInput,
  IsUserInteractedWithPostInput,
  PostDetailOutput,
  PostDetailWithAuthorOutput
} from '@/modules/post/domain/repositories/post.query.types';
import type { Pool } from 'pg';

type JsonRecord = Record<string, unknown>;

type DetailedPostRow = {
  id: string;
  user_id: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allow_stranger_comments: boolean;
  content: string;
  parent_id: string | null;
  hashtags: JsonRecord[];
  mentions: JsonRecord[];
  media: JsonRecord[];
  guest_views: number;
  user_views: number;
  created_at: Date;
  updated_at: Date;
  like_count: number;
  bookmark_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
  repost_count: number;
  comment_count: number;
  quote_count: number;
  author?: JsonRecord | null;
  source_post?: JsonRecord | null;
};

export class PostQueryRepository implements PostQueryRepositoryPort {
  constructor(protected readonly pool: Pool) {}

  async isUserInteractedWithPost({ postId, userId }: IsUserInteractedWithPostInput): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2
            AND deleted_at IS NULL
          UNION
          SELECT 1 FROM bookmarks WHERE user_id = $1 AND post_id = $2
            AND deleted_at IS NULL
          UNION
          SELECT 1 FROM posts WHERE user_id = $1 AND parent_id = $2 AND type = $3 AND deleted_at IS NULL
        ) AS exists
      `,
      [userId, postId, EnumPostType.COMMENT]
    );
    return result.rows[0]?.exists ?? false;
  }

  async findPostDetailById(id: string, currentUserId?: string): Promise<PostDetailWithAuthorOutput> {
    const rows = await this.findDetailedPosts({
      whereSql: `p.id = $1`,
      params: [id],
      includeAuthor: true,
      limit: 1,
      currentUserId
    });
    return rows[0] as PostDetailWithAuthorOutput;
  }

  async findPostIdsWhereUserInteractedWithAuthors({
    userId,
    authorIds
  }: FindPostIdsWhereUserInteractedWithAuthorsInput): Promise<string[]> {
    if (authorIds.length === 0) return [];

    const result = await this.pool.query<{ post_id: string }>(
      `
        SELECT DISTINCT post_id
        FROM (
          SELECT l.post_id
          FROM likes l
          JOIN posts p ON p.id = l.post_id
          WHERE l.user_id = $1
            AND p.user_id = ANY($2::text[])
            AND l.deleted_at IS NULL
            AND p.deleted_at IS NULL

          UNION

          SELECT b.post_id
          FROM bookmarks b
          JOIN posts p ON p.id = b.post_id
          WHERE b.user_id = $1
            AND p.user_id = ANY($2::text[])
            AND b.deleted_at IS NULL
            AND p.deleted_at IS NULL

          UNION

          SELECT c.parent_id AS post_id
          FROM posts c
          JOIN posts parent ON parent.id = c.parent_id
          WHERE c.user_id = $1
            AND c.type = $3
            AND c.parent_id IS NOT NULL
            AND parent.user_id = ANY($2::text[])
            AND c.deleted_at IS NULL
            AND parent.deleted_at IS NULL
        ) interacted
      `,
      [userId, authorIds, EnumPostType.COMMENT]
    );
    return result.rows.map((row) => row.post_id);
  }

  async findPosts(data: FindPostsInput): Promise<PostDetailWithAuthorOutput[]> {
    const { userId, cursor, limit, extraVisiblePostIds, authorUserIds } = data;
    const blocked = data.blockedAuthorIds.filter((id) => id !== userId);
    const friendIds = data.friendUserIds.filter((id) => id !== userId);
    const params: unknown[] = [];
    const branches = [
      `(p.audience = ${this.addParam(params, EnumPostAudience.PUBLIC)} AND NOT (p.user_id = ANY(${this.addParam(
        params,
        blocked
      )}::text[])))`,
      `p.user_id = ${this.addParam(params, userId)}`,
      `(p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)} AND p.user_id = ANY(${this.addParam(
        params,
        friendIds
      )}::text[]) AND NOT (p.user_id = ANY(${this.addParam(params, blocked)}::text[])))`
    ];

    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      branches.push(`p.id = ANY(${this.addParam(params, extraVisiblePostIds)}::text[])`);
    }

    const whereParts = [
      `(${branches.join(' OR ')})`,
      `p.type = ANY(${this.addParam(params, [EnumPostType.POST, EnumPostType.REPOST])}::text[])`
    ];
    if (authorUserIds && authorUserIds.length > 0) {
      whereParts.push(`p.user_id = ANY(${this.addParam(params, authorUserIds)}::text[])`);
    }
    this.addCursorFilter(whereParts, params, cursor);

    return this.findDetailedPosts({
      whereSql: whereParts.join(' AND '),
      params,
      includeAuthor: true,
      limit: limit + 1,
      currentUserId: userId
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  async findGuestPosts({ cursor, limit }: FindGuestPostsInput): Promise<PostDetailWithAuthorOutput[]> {
    const params: unknown[] = [EnumPostAudience.PUBLIC, [EnumPostType.POST, EnumPostType.REPOST]];
    const whereParts = [`p.audience = $1`, `p.type = ANY($2::text[])`];
    this.addCursorFilter(whereParts, params, cursor);
    return this.findDetailedPosts({
      whereSql: whereParts.join(' AND '),
      params,
      includeAuthor: true,
      limit: limit + 1
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  async findPostsByUserId({
    targetUserId,
    currentUserId,
    type,
    canViewFriendsOnly,
    includeOnlyMe,
    cursor,
    limit
  }: FindPostsByUserIdInput): Promise<PostDetailWithAuthorOutput[]> {
    const params: unknown[] = [];
    const whereParts = [`p.user_id = ${this.addParam(params, targetUserId)}`];
    const visibility = [`p.audience = ${this.addParam(params, EnumPostAudience.PUBLIC)}`];

    if (canViewFriendsOnly) {
      visibility.push(`p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)}`);
    } else if (currentUserId) {
      visibility.push(
        `(p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)} AND ${this.addParam(
          params,
          currentUserId
        )} = ANY(p.mentions))`
      );
    }

    if (includeOnlyMe) {
      visibility.push(`p.audience = ${this.addParam(params, EnumPostAudience.ONLY_ME)}`);
    }

    whereParts.push(`(${visibility.join(' OR ')})`);

    if (type) {
      whereParts.push(`p.type = ${this.addParam(params, type)}`);
    }

    this.addCursorFilter(whereParts, params, cursor);

    return this.findDetailedPosts({
      whereSql: whereParts.join(' AND '),
      params,
      includeAuthor: true,
      limit: limit + 1,
      currentUserId
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  async findPostsByUserInteraction({
    currentUserId,
    interaction,
    friendUserIds,
    blockedAuthorIds,
    extraVisiblePostIds,
    cursor,
    limit
  }: FindPostsByUserInteractionInput): Promise<PostDetailWithAuthorOutput[]> {
    const params: unknown[] = [];
    const tableName = interaction === 'likes' ? 'likes' : 'bookmarks';
    const blocked = blockedAuthorIds.filter((id) => id !== currentUserId);
    const friendIds = friendUserIds.filter((id) => id !== currentUserId);
    const userParam = this.addParam(params, currentUserId);
    const visibility = [
      `(p.audience = ${this.addParam(params, EnumPostAudience.PUBLIC)} AND NOT (p.user_id = ANY(${this.addParam(
        params,
        blocked
      )}::text[])))`,
      `p.user_id = ${userParam}`,
      `(p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)} AND p.user_id = ANY(${this.addParam(
        params,
        friendIds
      )}::text[]) AND NOT (p.user_id = ANY(${this.addParam(params, blocked)}::text[])))`,
      `(p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)} AND ${userParam} = ANY(p.mentions))`
    ];

    if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
      visibility.push(`p.id = ANY(${this.addParam(params, extraVisiblePostIds)}::text[])`);
    }

    const whereParts = [
      `EXISTS (
        SELECT 1
        FROM ${tableName} interaction
        WHERE interaction.user_id = ${userParam}
          AND interaction.post_id = p.id
          AND interaction.deleted_at IS NULL
      )`,
      `(${visibility.join(' OR ')})`
    ];

    this.addCursorFilter(whereParts, params, cursor);

    return this.findDetailedPosts({
      whereSql: whereParts.join(' AND '),
      params,
      includeAuthor: true,
      limit: limit + 1,
      currentUserId
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  async findPostsType({
    cursor,
    limit,
    postId,
    type,
    currentUserId
  }: FindPostsTypeInput): Promise<PostDetailWithAuthorOutput[]> {
    const params: unknown[] = [postId, type];
    const whereParts = [`p.parent_id = $1`, `p.type = $2`];
    this.addCursorFilter(whereParts, params, cursor);
    return this.findDetailedPosts({
      whereSql: whereParts.join(' AND '),
      params,
      includeAuthor: true,
      limit: limit + 1,
      currentUserId
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  async findPostsForSearch({
    query,
    userId,
    type,
    people,
    blockedAuthorIds,
    extraVisiblePostIds,
    limit,
    cursor,
    findFriendUserIds
  }: FindPostsForSearchInput): Promise<PostDetailWithAuthorOutput[]> {
    const params: unknown[] = [];
    const whereParts: string[] = [];

    if (query) {
      whereParts.push(`to_tsvector('simple', p.content) @@ plainto_tsquery('simple', ${this.addParam(params, query)})`);
    }

    if (type) {
      if ([EnumSearchType.VIDEO, EnumSearchType.VIDEO_STREAM].includes(type)) {
        whereParts.push(
          `(p.media @> ${this.addParam(params, JSON.stringify([{ type: EnumMediaType.VIDEO }]))}::jsonb OR p.media @> ${this.addParam(
            params,
            JSON.stringify([{ type: EnumMediaType.VIDEO_STREAM }])
          )}::jsonb)`
        );
      } else if (type === EnumSearchType.IMAGE) {
        whereParts.push(`p.media @> ${this.addParam(params, JSON.stringify([{ type: EnumMediaType.IMAGE }]))}::jsonb`);
      }
    }

    if (userId) {
      const blocked = (blockedAuthorIds ?? []).filter((id) => id !== userId);
      const friendIds = (await findFriendUserIds(userId)).filter((id) => id !== userId);
      const visibility = [
        `(p.audience = ${this.addParam(params, EnumPostAudience.PUBLIC)} AND NOT (p.user_id = ANY(${this.addParam(
          params,
          blocked
        )}::text[])))`,
        `p.user_id = ${this.addParam(params, userId)}`,
        `(p.audience = ${this.addParam(params, EnumPostAudience.FRIENDS_ONLY)} AND p.user_id = ANY(${this.addParam(
          params,
          friendIds
        )}::text[]) AND NOT (p.user_id = ANY(${this.addParam(params, blocked)}::text[])))`
      ];

      if (extraVisiblePostIds && extraVisiblePostIds.length > 0) {
        visibility.push(`p.id = ANY(${this.addParam(params, extraVisiblePostIds)}::text[])`);
      }
      whereParts.push(`(${visibility.join(' OR ')})`);

      if (people === EnumSearchPeople.FRIENDS) {
        whereParts.push(`p.user_id = ANY(${this.addParam(params, friendIds)}::text[])`);
      } else if (people === EnumSearchPeople.NOT_FRIENDS) {
        whereParts.push(`NOT (p.user_id = ANY(${this.addParam(params, friendIds)}::text[]))`);
      } else if (people === EnumSearchPeople.ONLY_ME) {
        whereParts.push(`p.user_id = ${this.addParam(params, userId)}`);
      }
    } else {
      whereParts.push(`p.audience = ${this.addParam(params, EnumPostAudience.PUBLIC)}`);
    }

    this.addCursorFilter(whereParts, params, cursor);

    return this.findDetailedPosts({
      whereSql: whereParts.length > 0 ? whereParts.join(' AND ') : 'TRUE',
      params,
      includeAuthor: true,
      limit: limit + 1,
      currentUserId: userId
    }) as Promise<PostDetailWithAuthorOutput[]>;
  }

  private async findDetailedPosts({
    whereSql,
    params,
    includeAuthor,
    limit,
    currentUserId
  }: {
    whereSql: string;
    params: unknown[];
    includeAuthor: boolean;
    limit: number;
    currentUserId?: string;
  }): Promise<PostDetailOutput[] | PostDetailWithAuthorOutput[]> {
    const values = [...params];
    const userPlaceholder = currentUserId ? `$${values.push(currentUserId)}` : null;
    values.push(limit);
    const limitPlaceholder = `$${values.length}`;
    const likedByMeSql = userPlaceholder
      ? `EXISTS (
          SELECT 1
          FROM likes user_like
          WHERE user_like.user_id = ${userPlaceholder}
            AND user_like.post_id = bp.id
            AND user_like.deleted_at IS NULL
        )`
      : 'false';
    const bookmarkedByMeSql = userPlaceholder
      ? `EXISTS (
          SELECT 1
          FROM bookmarks user_bookmark
          WHERE user_bookmark.user_id = ${userPlaceholder}
            AND user_bookmark.post_id = bp.id
            AND user_bookmark.deleted_at IS NULL
        )`
      : 'false';
    const sourceLikedByMeSql = userPlaceholder
      ? `EXISTS (
          SELECT 1
          FROM likes user_source_like
          WHERE user_source_like.user_id = ${userPlaceholder}
            AND user_source_like.post_id = source_post.id
            AND user_source_like.deleted_at IS NULL
        )`
      : 'false';
    const sourceBookmarkedByMeSql = userPlaceholder
      ? `EXISTS (
          SELECT 1
          FROM bookmarks user_source_bookmark
          WHERE user_source_bookmark.user_id = ${userPlaceholder}
            AND user_source_bookmark.post_id = source_post.id
            AND user_source_bookmark.deleted_at IS NULL
        )`
      : 'false';
    const result = await this.pool.query<DetailedPostRow>(
      `
        WITH base_posts AS (
          SELECT p.*
          FROM posts p
          WHERE (${whereSql}) AND p.deleted_at IS NULL
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT ${limitPlaceholder}
        )
        SELECT
          bp.id,
          bp.user_id,
          bp.type,
          bp.audience,
          bp.allow_stranger_comments,
          bp.content,
          bp.parent_id,
          COALESCE(hashtags.items, '[]'::json) AS hashtags,
          COALESCE(mentions.items, '[]'::json) AS mentions,
          bp.media,
          bp.guest_views,
          bp.user_views,
          bp.created_at,
          bp.updated_at,
          COALESCE(likes.total, 0)::int AS like_count,
          COALESCE(bookmarks.total, 0)::int AS bookmark_count,
          ${likedByMeSql} AS liked_by_me,
          ${bookmarkedByMeSql} AS bookmarked_by_me,
          COALESCE(children.repost_count, 0)::int AS repost_count,
          COALESCE(children.comment_count, 0)::int AS comment_count,
          COALESCE(children.quote_count, 0)::int AS quote_count,
          source.source_post
          ${
            includeAuthor
              ? `,
          json_build_object(
            'id', author.id,
            'name', author.name,
            'email', author.email,
            'username', author.username,
            'avatar', author.avatar
          ) AS author`
              : ''
          }
        FROM base_posts bp
        ${
          includeAuthor
            ? `
        LEFT JOIN users author ON author.id = bp.user_id AND author.deleted_at IS NULL`
            : ''
        }
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', h.id,
              'name', h.name,
              'createdAt', h.created_at,
              'updatedAt', h.updated_at
            )
            ORDER BY input.ord
          ) AS items
          FROM unnest(bp.hashtags) WITH ORDINALITY input(id, ord)
          JOIN hashtags h ON h.id = input.id AND h.deleted_at IS NULL
        ) hashtags ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'username', u.username,
              'status', u.status
            )
            ORDER BY input.ord
          ) AS items
          FROM unnest(bp.mentions) WITH ORDINALITY input(id, ord)
          JOIN users u ON u.id = input.id AND u.deleted_at IS NULL
        ) mentions ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS total
          FROM likes l
          WHERE l.post_id = bp.id AND l.deleted_at IS NULL
        ) likes ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS total
          FROM bookmarks b
          WHERE b.post_id = bp.id AND b.deleted_at IS NULL
        ) bookmarks ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) FILTER (WHERE child.type = '${EnumPostType.REPOST}')::int AS repost_count,
            COUNT(*) FILTER (WHERE child.type = '${EnumPostType.COMMENT}')::int AS comment_count,
            COUNT(*) FILTER (WHERE child.type = '${EnumPostType.QUOTE}')::int AS quote_count
          FROM posts child
          WHERE child.parent_id = bp.id AND child.deleted_at IS NULL
        ) children ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_build_object(
            'id', source_post.id,
            'userId', source_post.user_id,
            'type', source_post.type,
            'audience', source_post.audience,
            'allowStrangerComments', source_post.allow_stranger_comments,
            'content', source_post.content,
            'parentId', source_post.parent_id,
            'hashtags', COALESCE(source_hashtags.items, '[]'::json),
            'mentions', COALESCE(source_mentions.items, '[]'::json),
            'media', source_post.media,
            'guestViews', source_post.guest_views,
            'userViews', source_post.user_views,
            'createdAt', source_post.created_at,
            'updatedAt', source_post.updated_at,
            'likeCount', COALESCE(source_likes.total, 0)::int,
            'bookmarkCount', COALESCE(source_bookmarks.total, 0)::int,
            'likedByMe', ${sourceLikedByMeSql},
            'bookmarkedByMe', ${sourceBookmarkedByMeSql},
            'repostCount', COALESCE(source_children.repost_count, 0)::int,
            'commentCount', COALESCE(source_children.comment_count, 0)::int,
            'quoteCount', COALESCE(source_children.quote_count, 0)::int,
            'author', json_build_object(
              'id', source_author.id,
              'name', source_author.name,
              'email', source_author.email,
              'username', source_author.username,
              'avatar', source_author.avatar
            )
          ) AS source_post
          FROM posts source_post
          LEFT JOIN users source_author ON source_author.id = source_post.user_id AND source_author.deleted_at IS NULL
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'id', h.id,
                'name', h.name,
                'createdAt', h.created_at,
                'updatedAt', h.updated_at
              )
              ORDER BY input.ord
            ) AS items
            FROM unnest(source_post.hashtags) WITH ORDINALITY input(id, ord)
            JOIN hashtags h ON h.id = input.id AND h.deleted_at IS NULL
          ) source_hashtags ON TRUE
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'id', u.id,
                'name', u.name,
                'username', u.username,
                'status', u.status
              )
              ORDER BY input.ord
            ) AS items
            FROM unnest(source_post.mentions) WITH ORDINALITY input(id, ord)
            JOIN users u ON u.id = input.id AND u.deleted_at IS NULL
          ) source_mentions ON TRUE
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS total
            FROM likes l
            WHERE l.post_id = source_post.id AND l.deleted_at IS NULL
          ) source_likes ON TRUE
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS total
            FROM bookmarks b
            WHERE b.post_id = source_post.id AND b.deleted_at IS NULL
          ) source_bookmarks ON TRUE
          LEFT JOIN LATERAL (
            SELECT
              COUNT(*) FILTER (WHERE child.type = '${EnumPostType.REPOST}')::int AS repost_count,
              COUNT(*) FILTER (WHERE child.type = '${EnumPostType.COMMENT}')::int AS comment_count,
              COUNT(*) FILTER (WHERE child.type = '${EnumPostType.QUOTE}')::int AS quote_count
            FROM posts child
            WHERE child.parent_id = source_post.id AND child.deleted_at IS NULL
          ) source_children ON TRUE
          WHERE bp.type = '${EnumPostType.REPOST}'
            AND source_post.id = bp.parent_id
            AND source_post.deleted_at IS NULL
        ) source ON TRUE
        ORDER BY bp.created_at DESC, bp.id DESC
      `,
      values
    );
    return result.rows.map((row) => this.toPostDetail(row, includeAuthor));
  }

  private toPostDetail(row: DetailedPostRow, includeAuthor: boolean): PostDetailOutput | PostDetailWithAuthorOutput {
    const post: PostDetailOutput = {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      audience: row.audience,
      allowStrangerComments: row.allow_stranger_comments,
      content: row.content,
      parentId: row.parent_id,
      hashtags: row.hashtags.map((hashtag) => ({
        id: String(hashtag.id),
        name: String(hashtag.name),
        createdAt: new Date(String(hashtag.createdAt)),
        updatedAt: new Date(String(hashtag.updatedAt))
      })),
      mentions: row.mentions.map((mention) => ({
        id: String(mention.id),
        name: String(mention.name),
        username: mention.username === null || mention.username === undefined ? undefined : String(mention.username),
        status: String(mention.status)
      })) as PostDetailOutput['mentions'],
      media: row.media as unknown as PostDetailOutput['media'],
      guestViews: row.guest_views,
      userViews: row.user_views,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      likeCount: Number(row.like_count),
      bookmarkCount: Number(row.bookmark_count),
      likedByMe: Boolean(row.liked_by_me),
      bookmarkedByMe: Boolean(row.bookmarked_by_me),
      repostCount: Number(row.repost_count),
      commentCount: Number(row.comment_count),
      quoteCount: Number(row.quote_count),
      sourcePost: row.source_post ? this.toPostDetailJson(row.source_post) : null
    };

    if (!includeAuthor) return post;

    return {
      ...post,
      author: row.author
        ? {
            id: String(row.author.id),
            name: String(row.author.name),
            email: String(row.author.email),
            username:
              row.author.username === null || row.author.username === undefined
                ? undefined
                : String(row.author.username),
            avatar:
              row.author.avatar === null || row.author.avatar === undefined ? undefined : String(row.author.avatar)
          }
        : (undefined as unknown as PostDetailWithAuthorOutput['author'])
    };
  }

  private toPostDetailJson(record: JsonRecord): PostDetailWithAuthorOutput {
    const author = (record.author ?? null) as JsonRecord | null;
    return {
      id: String(record.id),
      userId: String(record.userId),
      type: record.type as EnumPostType,
      audience: record.audience as EnumPostAudience,
      allowStrangerComments: Boolean(record.allowStrangerComments),
      content: String(record.content ?? ''),
      parentId: record.parentId === null || record.parentId === undefined ? null : String(record.parentId),
      hashtags: ((record.hashtags ?? []) as JsonRecord[]).map((hashtag) => ({
        id: String(hashtag.id),
        name: String(hashtag.name),
        createdAt: new Date(String(hashtag.createdAt)),
        updatedAt: new Date(String(hashtag.updatedAt))
      })),
      mentions: ((record.mentions ?? []) as JsonRecord[]).map((mention) => ({
        id: String(mention.id),
        name: String(mention.name),
        username: mention.username === null || mention.username === undefined ? undefined : String(mention.username),
        status: String(mention.status)
      })) as PostDetailOutput['mentions'],
      media: (record.media ?? []) as unknown as PostDetailOutput['media'],
      guestViews: Number(record.guestViews ?? 0),
      userViews: Number(record.userViews ?? 0),
      createdAt: new Date(String(record.createdAt)),
      updatedAt: new Date(String(record.updatedAt)),
      likeCount: Number(record.likeCount ?? 0),
      bookmarkCount: Number(record.bookmarkCount ?? 0),
      likedByMe: Boolean(record.likedByMe),
      bookmarkedByMe: Boolean(record.bookmarkedByMe),
      repostCount: Number(record.repostCount ?? 0),
      commentCount: Number(record.commentCount ?? 0),
      quoteCount: Number(record.quoteCount ?? 0),
      sourcePost: null,
      author: author
        ? {
            id: String(author.id),
            name: String(author.name),
            email: String(author.email),
            username:
              author.username === null || author.username === undefined ? undefined : String(author.username),
            avatar: author.avatar === null || author.avatar === undefined ? undefined : String(author.avatar)
          }
        : (undefined as unknown as PostDetailWithAuthorOutput['author'])
    };
  }

  private addCursorFilter(whereParts: string[], params: unknown[], cursor?: DateIdCursor): void {
    if (!cursor) return;
    const { createdAt, id } = cursor.raw();
    const createdAtParam = this.addParam(params, createdAt);
    const idParam = this.addParam(params, id);
    whereParts.push(`(p.created_at < ${createdAtParam} OR (p.created_at = ${createdAtParam} AND p.id < ${idParam}))`);
  }

  private addParam(params: unknown[], value: unknown): string {
    params.push(value);
    return `$${params.length}`;
  }
}
