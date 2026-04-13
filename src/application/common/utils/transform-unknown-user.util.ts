/**
 * consistent "unknown user" payloads when a viewer must not see a blocked author's PII but may still see post content they previously engaged with (like, bookmark, or comment on that post).
 */

import { PostDetailResultDTO, PostNewFeedResultDTO } from '@/application/dtos/post/post.result.dto';

import { ObjectId } from 'mongodb'; // TODO: application should not depend on infrastructure

/** Sentinel id — not a real user; clients must not link to profile. */
const UNKNOWN_USER_ID = new ObjectId('000000000000000000000000').toString(); // TODO: application shouldn not depend on infrastructure

export function transformUnknownAuthor(post: PostNewFeedResultDTO): void {
  post.author = {
    id: UNKNOWN_USER_ID,
    name: 'Unknown user',
    email: 'unknown@invalid',
    username: 'unknown',
    avatar: ''
  };
}

/** Redact root post author on detail DTO (mutates). */
export function transformUnknownAuthorForPostDetail(post: PostDetailResultDTO): void {
  const authorId = post.userId;
  post.userId = UNKNOWN_USER_ID;
  post.mentions = post.mentions.map((mention) => {
    if (mention.id === authorId) {
      return {
        id: UNKNOWN_USER_ID,
        name: 'Unknown user',
        email: 'unknown@invalid',
        username: 'unknown',
        verificationStatus: undefined
      };
    }
    return mention;
  });
}
