/**
 * consistent "unknown user" payloads when a viewer must not see a blocked author's PII but may still see post content they previously engaged with (like, bookmark, or comment on that post).
 */

import { EUserStatus } from '@/domain/entities/user/user.type';
import { IPostDetailOutput, IPostDetailWithAuthorOutput } from '@/application/queries/post/post-query.type';

/** Sentinel id — not a real user; clients must not link to profile. */
const UNKNOWN_USER_ID = '00000000-0000-0000-0000-000000000000';

export function transformUnknownAuthor(post: IPostDetailWithAuthorOutput): void {
  post.author = {
    id: UNKNOWN_USER_ID,
    name: 'Unknown user',
    email: 'unknown@invalid',
    username: 'unknown',
    avatar: ''
  };
}

/** Redact root post author on detail DTO (mutates). */
export function transformUnknownAuthorForPostDetail(post: IPostDetailOutput): void {
  const authorId = post.userId;
  post.userId = UNKNOWN_USER_ID;
  post.mentions = post.mentions.map((mention) => {
    if (mention.id === authorId) {
      return {
        id: UNKNOWN_USER_ID,
        name: 'Unknown user',
        email: 'unknown@invalid',
        username: 'unknown',
        status: EUserStatus.UNKNOWN
      };
    }
    return mention;
  });
}
